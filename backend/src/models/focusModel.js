import { db } from "../config/firebase.js";

// Helper to get the collection reference
const focusCollection = (uid) => db.collection("users").doc(uid).collection("focus_sessions");

export const FocusModel = {
  // 1. Save a completed session
  create: async (uid, sessionData) => {
    // sessionData should contain: { duration: 25, mode: 'focus', completedAt: ... }
    const docRef = await focusCollection(uid).add({
      ...sessionData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...sessionData };
  },

  // 2. Get session history (Useful for stats later)
  findAll: async (uid) => {
    const snapshot = await focusCollection(uid).orderBy("createdAt", "desc").limit(10).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};