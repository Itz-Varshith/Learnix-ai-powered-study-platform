import dotenv from "dotenv/config";
import { verifyToken } from "./middlewares/authMiddleware.js";

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// Import Socket handlers
import { initializeSocketHandlers } from "./controllers/chatController.js";

const app = express();
const PORT = process.env.PORT || 9000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
});

// Global Middleware
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Use Routes
app.use("/auth", authRoutes); // Endpoints starting with /auth
app.use("/api/todos", todoRoutes); // Endpoints starting with /api/todos
app.use("/api/focus", focusRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/courses", verifyToken, courseRoutes); // Endpoints starting with /api/courses (protected)
app.use("/api/chat", verifyToken, chatRoutes); // Chat REST API (protected)

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Start Server (use httpServer instead of app.listen for Socket.IO)
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
