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
  fetchStudyGroups,
  fetchJoinedStudyGroups,
  addStudyGroupHead,
  getStudyGroupMembers,
} from "../controllers/courseController.js";
import { upload } from "../config/cloudinary.js";

const courseRouter = new Router();

courseRouter.get("/enrolled-courses/:uid", getEnrolledCourses);
courseRouter.get("/all-courses", fetchAllCourses);
courseRouter.get("/get-files/:courseId", getFiles);
courseRouter.get("/get-flashcards", getFlashcards);
courseRouter.get("/get-quiz", getQuiz);
courseRouter.get("/fetch-study-groups", fetchStudyGroups);
courseRouter.get("/fetch-joined-study-groups", fetchJoinedStudyGroups);
courseRouter.get("/get-study-group-members/:studyGroupId", getStudyGroupMembers);
courseRouter.post("/create-course", createCourse);
courseRouter.post("/add-study-group-head/:studyGroupId", addStudyGroupHead);
courseRouter.post("/enroll/:courseId", enrollInCourse);
courseRouter.post("/upload-file", upload.single("file"), uploadFile);
courseRouter.post("/solve-doubt", solveDoubt);

export default courseRouter;
