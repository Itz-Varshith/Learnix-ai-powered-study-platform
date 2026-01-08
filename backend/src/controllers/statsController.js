import { db } from "../config/firebase.js";

export const getUserStats = async (req, res) => {
  try {
    const { uid } = req.params;
    
    // --- 1. Fetch ALL Focus Sessions ---
    const focusSnapshot = await db.collection('users').doc(uid).collection('focus_sessions').get();
    
    let totalMinutes = 0;
    const focusHistory = {}; // Format: { "2024-01-01": 45, "2024-01-02": 120 }

    focusSnapshot.forEach(doc => {
      const data = doc.data();
      const minutes = data.duration || 0;
      totalMinutes += minutes;

      // Convert timestamp to YYYY-MM-DD
      const date = new Date(data.createdAt); // Ensure you store ISO strings or Timestamps
      const dateKey = date.toISOString().split('T')[0];

      if (focusHistory[dateKey]) {
        focusHistory[dateKey] += minutes;
      } else {
        focusHistory[dateKey] = minutes;
      }
    });

    // --- 2. Fetch ALL Completed Tasks ---
    const tasksSnapshot = await db.collection('users').doc(uid).collection('tasks')
      .where('completed', '==', true)
      .get();

    const taskHistory = {}; // Format: { "2024-01-01": 5, "2024-01-02": 2 }
    let tasksCompletedToday = 0;
    
    const todayKey = new Date().toISOString().split('T')[0];

    tasksSnapshot.forEach(doc => {
      const data = doc.data();
      // Use completedAt if available, otherwise createdAt, otherwise fallback to now
      const rawDate = data.completedAt || data.createdAt || new Date().toISOString();
      const date = new Date(rawDate);
      const dateKey = date.toISOString().split('T')[0];

      if (dateKey === todayKey) {
        tasksCompletedToday++;
      }

      if (taskHistory[dateKey]) {
        taskHistory[dateKey] += 1;
      } else {
        taskHistory[dateKey] = 1;
      }
    });

    // --- 3. Calculate "Today's" Focus (from history map) ---
    const minutesFocusedToday = focusHistory[todayKey] || 0;

    // --- 4. Return Data Bundle ---
    res.status(200).json({
      minutesFocusedToday,
      tasksCompletedToday,
      totalFocusHours: (totalMinutes / 60).toFixed(1),
      focusHistory, // <--- New Full History
      taskHistory   // <--- New Full History
    });

  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: error.message });
  }
};