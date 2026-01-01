// src/models/todoModel.js
import { db } from "../config/firebase.js";

// Collection Reference
const userTasks = (uid) => db.collection("users").doc(uid).collection("tasks");

export const TodoModel = {
  // 1. Get all tasks
  findAll: async (uid) => {
    const snapshot = await userTasks(uid).orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  // 2. Create a task
  create: async (uid, taskData) => {
    const docRef = await userTasks(uid).add({
      ...taskData,
      createdAt: new Date().toISOString(),
      completed: false,
    });
    return { id: docRef.id, ...taskData };
  },

  // 3. Update a task
  update: async (uid, taskId, updateData) => {
    await userTasks(uid).doc(taskId).update(updateData);
    return true;
  },

  // 4. Delete a task
  delete: async (uid, taskId) => {
    await userTasks(uid).doc(taskId).delete();
    return true;
  },
};