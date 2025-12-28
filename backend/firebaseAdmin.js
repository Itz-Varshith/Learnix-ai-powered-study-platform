// backend/firebaseAdmin.js
import admin from "firebase-admin";
import { createRequire } from "module"; 

const require = createRequire(import.meta.url); 
const serviceAccount = require("./serviceAccountKey.json"); 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const auth = admin.auth();
export const db = admin.firestore();