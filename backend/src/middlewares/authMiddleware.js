import { auth } from "../config/firebase.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    // Domain Restriction Check
    if (!decodedToken.email.endsWith("@iiti.ac.in")) {
      return res.status(403).json({ error: "Institution email required (@iiti.ac.in)" });
    }

    // Attach user info to the request so controllers can use it
    req.user = decodedToken;
    next(); // Pass control to the next function (the controller)
    
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};