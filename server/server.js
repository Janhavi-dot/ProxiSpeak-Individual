
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

await mongoose.connect(MONGODB_URI);
console.log("MongoDB connected successfully");

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
  res.json({ success: true, service: "ProxiSpeak API" });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);


  socket.on("get-nearby-users", async (ack) => {
    const respond =
      typeof ack === "function"
        ? ack
        : (result) => socket.emit("nearby-users", result);

    try {
      // Get the requesting user's saved position.
      const currentUser = await User.findOne({
        socketId: socket.id,
      })
        .select("position")
        .lean();

      if (!currentUser) {
        return respond({
          success: false,
          users: [],
          message: "Position not available yet.",
        });
      }

      // Find users within 100 pixels using MongoDB's 2D index.
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
      console.error(
        "Failed to find nearby users:",
        error.message
      );

      respond({
        success: false,
        users: [],
        message: "Failed to find nearby users.",
      });
    }
  });


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
          returnDocument: "after",
          runValidators: true,
        }
      );

      socket.broadcast.emit("avatar-moved", {
        id: socket.id,
        x: position.x,
        y: position.y,
      });
    } catch (error) {
      console.error("Failed to save avatar position:", error.message);
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    try {
      await User.deleteOne({ socketId: socket.id });
    } catch (error) {
      console.error("Failed to remove disconnected user:", error.message);
    }
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`ProxiSpeak server running on port ${PORT}`);
});
