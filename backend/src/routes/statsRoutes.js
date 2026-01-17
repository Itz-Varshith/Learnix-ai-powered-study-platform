import express from "express";
import { getUserStats } from "../controllers/statsController.js";

const router = express.Router();

router.get("/:uid", getUserStats);

export default router;