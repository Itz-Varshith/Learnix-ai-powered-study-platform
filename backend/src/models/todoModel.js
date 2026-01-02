// backend/src/models/todoModel.js
import { db } from "../config/firebase.js";
const userTasks = (uid) => db.collection("users").doc(uid).collection("tasks");

export const TodoModel = {
  findAll: async (uid) => {
    const snapshot = await userTasks(uid).orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  create: async (uid, taskData) => {
    const docRef = await userTasks(uid).add({
      ...taskData,
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null // Initialize as null
    });
    return { id: docRef.id, ...taskData };
  },

  update: async (uid, taskId, updateData) => {
    if (updateData.completed === true) {
      updateData.completedAt = new Date().toISOString();
    } else if (updateData.completed === false) {
      updateData.completedAt = null; 
    }
    
    await userTasks(uid).doc(taskId).update(updateData);
    return true;
  },

  delete: async (uid, taskId) => {
    await userTasks(uid).doc(taskId).delete();
    return true;
  },
};