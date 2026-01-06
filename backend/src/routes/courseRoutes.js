import { Router } from "express";
import {
  getEnrolledCourses,
  fetchAllCourses,
  getFiles,
  enrollInCourse,
  uploadFile,
  solveDoubt,
  getFlashcards,
  getQuiz,
  createCourse,
} from "../controllers/courseController.js";
import { upload } from "../config/cloudinary.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const courseRouter = new Router();

courseRouter.get("/enrolled-courses/:uid", getEnrolledCourses);
courseRouter.get("/all-courses", fetchAllCourses);
courseRouter.get("/get-files/:courseId", getFiles);
courseRouter.get("/get-flashcards", getFlashcards);
courseRouter.get("/get-quiz", getQuiz);
courseRouter.post("/create-course", createCourse);
courseRouter.post("/enroll/:courseId", verifyToken, enrollInCourse);
courseRouter.post(
  "/upload-file",
  verifyToken,
  upload.single("file"),
  uploadFile
);
courseRouter.post("/solve-doubt", solveDoubt);

export default courseRouter;
