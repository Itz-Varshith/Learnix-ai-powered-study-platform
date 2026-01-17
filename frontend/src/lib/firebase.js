// frontend/src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9hMD0wpA-AYITLaRQzOjoy3n9tgB_2uM",
  authDomain: "learnix-2b566.firebaseapp.com",
  projectId: "learnix-2b566",
  storageBucket: "learnix-2b566.firebasestorage.app",
  messagingSenderId: "1088989077712",
  appId: "1:1088989077712:web:9d61782e48429de395fed5",
  measurementId: "G-TZCB5QCRL8"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);