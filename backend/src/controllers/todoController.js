// src/controllers/todoController.js
import { TodoModel } from "../models/todoModel.js"; // <--- Import the Model

export const getTodos = async (req, res) => {
  try {
    const { uid } = req.params;
    const tasks = await TodoModel.findAll(uid); // <--- Use Model
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTodo = async (req, res) => {
  try {
    const { uid, text, priority, deadline } = req.body;
    
    // Controller handles validation
    if (!text) return res.status(400).json({ error: "Task text is required" });

    // Model handles saving
    const newTask = await TodoModel.create(uid, {
      text,
      priority: priority || "Medium",
      deadline: deadline || "",
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const { uid, taskId } = req.params;
    const { completed } = req.body;

    await TodoModel.update(uid, taskId, { completed }); // <--- Use Model
    res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const { uid, taskId } = req.params;
    await TodoModel.delete(uid, taskId); // <--- Use Model
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};