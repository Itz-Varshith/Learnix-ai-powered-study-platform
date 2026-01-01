import express from "express";
import { loginUser } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", verifyToken, loginUser);

export default router;