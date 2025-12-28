// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { auth } from "./firebaseAdmin.js"; 

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
dotenv.config();
app.post("/auth/login", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("No token provided");
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const { uid, email } = decodedToken;

    if (!email.endsWith("@iiti.ac.in")) {       //Internal user only
      console.log(`Blocked login attempt from: ${email}`);
      return res.status(403).json({ error: "Institution email required" });
    }

    console.log(`User verified: ${email}`);
    
    
    return res.status(200).json({ message: "User is authentic", uid });

  } catch (error) {
    console.error("Verification failed:", error);
    return res.status(403).send("Invalid Token");
  }
});

app.listen(9000, () => {
  console.log("Server running on port 9000");
});