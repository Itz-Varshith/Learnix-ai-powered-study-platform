import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Adjust path to go up one level from 'src/config' to root
const serviceAccount = require("../../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();
export const auth = admin.auth();