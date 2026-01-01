import express from "express";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../controllers/todoController.js";

const router = express.Router();

router.get("/:uid", getTodos);
router.post("/", createTodo);
router.put("/:uid/:taskId", updateTodo);
router.delete("/:uid/:taskId", deleteTodo);

export default router;