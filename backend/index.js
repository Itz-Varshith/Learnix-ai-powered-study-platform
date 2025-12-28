import express from "express"
import cors from "cors"
import dotenv from "dotenv"; 

const app= new express();

// Config for allowing json request, responses
app.use(express.json())
// Config for CORS
app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
// Config for dotenv
dotenv.config()
app.get("/",(req,res)=>{
    return res.send("Backend running for Learnix AI Powered Study platform")    
})

// Server Runs on the port 9000.
app.listen(9000,()=>{
    console.log("Server started running on port 9000")
})
