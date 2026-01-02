import { db } from "../config/firebase.js";

export const getUserStats = async (req, res) => {
  try {
    const { uid } = req.params;
    const now = new Date();
    
    // 1. Calculate "Start of Today" (Midnight)
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayISO = startOfToday.toISOString();

    // 2. Fetch Tasks Completed Today
    // Note: We filter by 'completedAt' which we just added
    const tasksQuery = await db.collection('users').doc(uid).collection('tasks')
      .where('completed', '==', true)
      .where('completedAt', '>=', startOfTodayISO) 
      .get();
      
    const tasksCompletedToday = tasksQuery.size;

    // 3. Fetch Focus Sessions Today
    const focusQuery = await db.collection('users').doc(uid).collection('focus_sessions')
      .where('createdAt', '>=', startOfTodayISO)
      .get();

    let minutesFocusedToday = 0;
    focusQuery.forEach(doc => {
      minutesFocusedToday += (doc.data().duration || 0);
    });

    // 4. Calculate Weekly Activity (Last 7 Days)
    const weeklyActivity = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Loop backwards for 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      
      const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
      
      // Query specific day's focus sessions
      // (Note: In production, doing 7 separate queries is okay for small scale, 
      // but aggregation queries are better for scaling)
      const dayQuery = await db.collection('users').doc(uid).collection('focus_sessions')
        .where('createdAt', '>=', dayStart.toISOString())
        .where('createdAt', '<=', dayEnd.toISOString())
        .get();

      let dailyMinutes = 0;
      dayQuery.forEach(doc => dailyMinutes += (doc.data().duration || 0));

      weeklyActivity.push({
        day: days[dayStart.getDay()],
        minutes: dailyMinutes
      });
    }

    // 5. Calculate Total Lifetime Focus Hours
    const allFocusQuery = await db.collection('users').doc(uid).collection('focus_sessions').get();
    let totalMinutes = 0;
    allFocusQuery.forEach(doc => totalMinutes += (doc.data().duration || 0));
    const totalFocusHours = (totalMinutes / 60).toFixed(1);

    // Return the JSON bundle
    res.status(200).json({
      minutesFocusedToday,
      tasksCompletedToday,
      totalFocusHours,
      weeklyActivity
    });

  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: error.message });
  }
};