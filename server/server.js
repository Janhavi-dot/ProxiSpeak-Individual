
import mongoose from "mongoose";
import User from "./models/User.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is missing from server/.env");
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.json({ message: "ProxiSpeak backend is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "ProxiSpeak API",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected",
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Check whether two users are within 100 pixels.
  async function areUsersNearby(targetSocketId) {
    if (
      typeof targetSocketId !== "string" ||
      targetSocketId === socket.id
    ) {
      return false;
    }

    const users = await User.find({
      socketId: { $in: [socket.id, targetSocketId] },
    })
      .select("socketId position")
      .lean();

    if (users.length !== 2) return false;

    const currentUser = users.find(
      (user) => user.socketId === socket.id
    );
    const targetUser = users.find(
      (user) => user.socketId === targetSocketId
    );

    if (
      !currentUser?.position ||
      !targetUser?.position ||
      currentUser.position.length < 2 ||
      targetUser.position.length < 2
    ) {
      return false;
    }

    const dx = currentUser.position[0] - targetUser.position[0];
    const dy = currentUser.position[1] - targetUser.position[1];

    return Math.hypot(dx, dy) <= 100;
  }

  // Relay WebRTC signaling only to nearby users.
  async function relayWebRTCSignal(event, targetSocketId, payload) {
    try {
      if (!(await areUsersNearby(targetSocketId))) {
        socket.emit("webrtc-error", {
          message: "Audio signaling requires a nearby user.",
        });
        return;
      }

      io.to(targetSocketId).emit(event, {
        from: socket.id,
        payload,
      });
    } catch (error) {
      console.error("WebRTC signaling failed:", error.message);

      socket.emit("webrtc-error", {
        message: "Unable to forward WebRTC signaling.",
      });
    }
  }

  socket.on("webrtc-offer", ({ targetSocketId, offer } = {}) => {
    if (!offer || typeof offer !== "object") return;

    void relayWebRTCSignal("webrtc-offer", targetSocketId, offer);
  });

  socket.on("webrtc-answer", ({ targetSocketId, answer } = {}) => {
    if (!answer || typeof answer !== "object") return;

    void relayWebRTCSignal("webrtc-answer", targetSocketId, answer);
  });

  socket.on(
    "webrtc-ice-candidate",
    ({ targetSocketId, candidate } = {}) => {
      if (!candidate || typeof candidate !== "object") return;

      void relayWebRTCSignal(
        "webrtc-ice-candidate",
        targetSocketId,
        candidate
      );
    }
  );

  // Send current nearby users to the requesting client.
  socket.on("get-nearby-users", async (callback) => {
    const respond =
      typeof callback === "function" ? callback : () => {};

    try {
      const currentUser = await User.findOne({
        socketId: socket.id,
      })
        .select("position")
        .lean();

      if (!currentUser?.position) {
        respond({ success: true, users: [] });
        return;
      }

      const nearbyUsers = await User.find({
        socketId: { $ne: socket.id },
        position: {
          $near: currentUser.position,
          $maxDistance: 100,
        },
      })
        .select("socketId position -_id")
        .lean();

      respond({
        success: true,
        users: nearbyUsers.map((user) => ({
          id: user.socketId,
          x: user.position[0],
          y: user.position[1],
        })),
      });
    } catch (error) {
      console.error("Failed to find nearby users:", error.message);

      respond({
        success: false,
        users: [],
        message: "Failed to find nearby users.",
      });
    }
  });

  // Save avatar position and synchronize it with other clients.
  socket.on("avatar-move", async (position) => {
    if (
      !position ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y)
    ) {
      return;
    }

    try {
      await User.findOneAndUpdate(
        { socketId: socket.id },
        {
          $set: {
            position: [position.x, position.y],
          },
          $setOnInsert: {
            socketId: socket.id,
          },
        },
        {
          upsert: true,
          runValidators: true,
        }
      );

      const avatar = {
        id: socket.id,
        x: position.x,
        y: position.y,
      };

      // Update existing clients.
      socket.broadcast.emit("avatar-moved", avatar);
    } catch (error) {
      console.error("Failed to update avatar position:", error.message);
    }
  });

  // Remove disconnected users and notify the remaining clients.
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    try {
      await User.deleteOne({ socketId: socket.id });
      socket.broadcast.emit("user-left", socket.id);
    } catch (error) {
      console.error("Failed to remove disconnected user:", error.message);
    }
  });
});

// Connect to MongoDB before starting the HTTP server.
try {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected successfully");

  const PORT = process.env.PORT || 5000;

  httpServer.listen(PORT, () => {
    console.log(`ProxiSpeak server running on port ${PORT}`);
  });
} catch (error) {
  console.error("MongoDB connection failed:", error.message);
  process.exit(1);
}
