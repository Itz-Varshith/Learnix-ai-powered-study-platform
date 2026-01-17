import { Router } from "express";
import { getChatHistory } from "../controllers/chatController.js";

const chatRouter = new Router();

chatRouter.get("/:courseId", getChatHistory);

export default chatRouter;

