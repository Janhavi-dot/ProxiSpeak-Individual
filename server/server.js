import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";

dotenv.config();

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
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Receive and broadcast avatar position
  socket.on("avatar-move", (position) => {
    socket.broadcast.emit("avatar-moved", {
      id: socket.id,
      x: position.x,
      y: position.y,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`ProxiSpeak server running on port ${PORT}`);
});