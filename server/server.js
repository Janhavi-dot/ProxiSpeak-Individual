
import mongoose from "mongoose";
import User from "./models/User.js";
import AuthUser from "./models/AuthUser.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

// Register a new user.
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await AuthUser.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await AuthUser.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Signup failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create account. Please try again.",
    });
  }
});

// Log in an existing user.
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password.",
      });
    }

    const user = await AuthUser.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
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

  // Send the positions of currently connected users to all clients.
async function broadcastConnectedUsers() {
  try {
    const connectedIds = [...io.sockets.sockets.keys()];

    const users = await User.find({
      socketId: { $in: connectedIds },
    })
      .select("socketId position -_id")
      .lean();

    const avatars = users
      .filter(
        (user) =>
          user.position &&
          user.position.length === 2 &&
          user.position.every(Number.isFinite)
      )
      .map((user) => ({
        id: user.socketId,
        x: user.position[0],
        y: user.position[1],
      }));

    io.emit("connected-users", avatars);
  } catch (error) {
    console.error("Failed to broadcast connected users:", error.message);
  }
}

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

  // Send only currently connected users for avatar display.
socket.on("get-connected-users", async (callback) => {
  const respond =
    typeof callback === "function" ? callback : () => {};

  try {
    const connectedIds = [...io.sockets.sockets.keys()];

    const users = await User.find({
  socketId: {
    $in: connectedIds.filter((id) => id !== socket.id),
  },
})
  .select("socketId position -_id")
  .lean();

    respond({
      success: true,
      users: users
        .filter(
          (user) =>
            user.position &&
            user.position.length === 2 &&
            user.position.every(Number.isFinite)
        )
        .map((user) => ({
          id: user.socketId,
          x: user.position[0],
          y: user.position[1],
        })),
    });
  } catch (error) {
    console.error("Failed to get connected users:", error.message);
    respond({ success: false, users: [] });
  }
});

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
      void broadcastConnectedUsers();
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

      void broadcastConnectedUsers();
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
