import { FocusModel } from "../models/focusModel.js";

export const saveSession = async (req, res) => {
  try {
    const { uid, duration, mode } = req.body;

    if (!uid || !duration) {
      return res.status(400).json({ error: "Missing required fields (uid, duration)" });
    }

    const newSession = await FocusModel.create(uid, {
      duration, // Duration in minutes
      mode,     // 'focus' or 'break'
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { uid } = req.params;
    const history = await FocusModel.findAll(uid);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};