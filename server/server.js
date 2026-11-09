import Account from "./models/Account.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "./models/User.js";
import Room from "./models/Room.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

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

// Register a new account
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingAccount = await Account.findOne({
      email: normalizedEmail,
    });

    if (existingAccount) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const account = await Account.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: account._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: account._id,
        name: account.name,
        email: account.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      message: "Unable to create account.",
    });
  }
});


// Login an existing account
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const account = await Account.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!account) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      account.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { id: account._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: account._id,
        name: account.name,
        email: account.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to login.",
    });
  }
});

// Get the saved office layout or create the default layout
app.get("/api/room", async (req, res) => {
  try {
    let room = await Room.findOne({ roomId: "main-office" });

    if (!room) {
      room = await Room.create({
        roomId: "main-office",
        width: 1000,
        height: 880,
        furniture: [],
      });
    }

    res.json(room);
  } catch (error) {
    console.error("Error loading office layout:", error);
    res.status(500).json({ message: "Failed to load office layout." });
  }
});

// Save or update the office layout
app.put("/api/room", async (req, res) => {
  try {
    const { width, height, furniture, obstacles } = req.body;

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      !Array.isArray(furniture) ||
      !Array.isArray(obstacles)
    ) {
      return res.status(400).json({
        message:
          "Valid width, height, furniture, and obstacles data are required.",
      });
    }

    const room = await Room.findOneAndUpdate(
      { roomId: "main-office" },
      {
        $set: {
          width,
          height,
          furniture,
          obstacles,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      message: "Office layout saved successfully.",
      room,
    });
  } catch (error) {
    console.error("Error saving office layout:", error);
    res.status(500).json({
      message: "Failed to save office layout.",
    });
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Verify authentication token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).json({
        message: "Invalid or expired token.",
      });
    }

    req.userId = decoded.id;
    next();
  });
};


// Get currently logged-in user
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const account = await Account.findById(req.userId)
      .select("_id name email")
      .lean();

    if (!account) {
      return res.status(401).json({
        message: "Account not found.",
      });
    }

    res.json({
      user: {
        id: account._id,
        name: account.name,
        email: account.email,
      },
    });
  } catch (error) {
    console.error("Authentication verification error:", error.message);

    res.status(500).json({
      message: "Unable to verify account.",
    });
  }
});

// Redis clients for sharing Socket.IO events across server instances.
const pubClient = createClient({
  url: process.env.REDIS_URL,
});

const subClient = pubClient.duplicate();

pubClient.on("error", (error) => {
  console.error("Redis publisher error:", error.message);
});

subClient.on("error", (error) => {
  console.error("Redis subscriber error:", error.message);
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

  // Send the positions of currently connected users to all clients.
  async function broadcastConnectedUsers() {
    try {
      const connectedSockets = await io.fetchSockets();
      const connectedIds = connectedSockets.map((connectedSocket) => connectedSocket.id);

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
      const connectedSockets = await io.fetchSockets();
      const connectedIds = connectedSockets
        .map((connectedSocket) => connectedSocket.id)
        .filter((id) => id !== socket.id);

      const users = await User.find({
        socketId: { $in: connectedIds },
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
    } finally {
      void broadcastConnectedUsers();
    }
  });
});

// Connect to MongoDB before starting the HTTP server.
try {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected successfully");

  // Connect both Redis clients before accepting connections.
  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
  ]);
  console.log("Redis connected successfully");

  // Enable communication between multiple Socket.IO server instances.
  io.adapter(createAdapter(pubClient, subClient));
  console.log("Socket.IO Redis adapter enabled");

  const PORT = process.env.PORT || 5000;

  httpServer.listen(PORT, () => {
    console.log(`ProxiSpeak server running on port ${PORT}`);
  });
} catch (error) {
  console.error("Server startup failed:", error.message);
  process.exit(1);
}