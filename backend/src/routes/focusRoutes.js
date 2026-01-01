import express from "express";
import { saveSession, getHistory } from "../controllers/focusController.js";

const router = express.Router();

router.post("/", saveSession);    // POST http://localhost:9000/api/focus
router.get("/:uid", getHistory);  // GET http://localhost:9000/api/focus/:uid

export default router;