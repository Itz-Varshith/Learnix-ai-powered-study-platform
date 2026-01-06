import dotenv from "dotenv/config";


import express from "express";
import cors from "cors";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";

const app = express();
const PORT = 9000;

// Global Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Use Routes
app.use("/auth", authRoutes); // Endpoints starting with /auth
app.use("/api/todos", todoRoutes); // Endpoints starting with /api/todos
app.use("/api/focus", focusRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/courses", courseRoutes); // Endpoints starting with /api/courses

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
