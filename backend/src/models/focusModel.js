import { db } from "../config/firebase.js";

// Helper to get the collection reference
const focusCollection = (uid) => db.collection("users").doc(uid).collection("focus_sessions");

export const FocusModel = {
  create: async (uid, sessionData) => {
    const docRef = await focusCollection(uid).add({
      ...sessionData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...sessionData };
  },

  findAll: async (uid) => {
    const snapshot = await focusCollection(uid).orderBy("createdAt", "desc").limit(10).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};