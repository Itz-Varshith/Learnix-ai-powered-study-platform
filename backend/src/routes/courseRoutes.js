import { Router } from "express";
import {
  getEnrolledCourses,
  fetchAllCourses,
  getFiles,
  enrollInCourse,
  uploadFile,
  summarizeFile,
  getSummarizedFiles,
  generateFlashcards,
  getFlashcardsHistory,
  generateQuiz,
  getQuizHistory,
  createCourse,
  fetchStudyGroups,
  fetchJoinedStudyGroups,
  addStudyGroupHead,
  getStudyGroupMembers,
  sendStudyGroupRequest,
  fetchStudyGroupRequests,
  changeStatusForRequest,
} from "../controllers/courseController.js";
import { upload } from "../config/cloudinary.js";

const courseRouter = new Router();

courseRouter.get("/enrolled-courses/:uid", getEnrolledCourses);
courseRouter.get("/all-courses", fetchAllCourses);
courseRouter.get("/get-files/:courseId", getFiles);
courseRouter.get("/get-summarized-files/:courseId", getSummarizedFiles);
courseRouter.get("/get-flashcards-history/:courseId", getFlashcardsHistory);
courseRouter.get("/get-quiz-history/:courseId", getQuizHistory);
courseRouter.get("/fetch-study-groups", fetchStudyGroups);
courseRouter.get("/fetch-joined-study-groups", fetchJoinedStudyGroups);
courseRouter.get("/get-study-group-members/:studyGroupId", getStudyGroupMembers);
courseRouter.post("/send-study-group-request", sendStudyGroupRequest);
courseRouter.get("/fetch-study-group-requests", fetchStudyGroupRequests);
courseRouter.post("/change-status-for-request", changeStatusForRequest);
courseRouter.post("/create-course", createCourse);
courseRouter.post("/add-study-group-head/:studyGroupId", addStudyGroupHead);
courseRouter.post("/enroll/:courseId", enrollInCourse);
courseRouter.post("/upload-file", upload.single("file"), uploadFile);
courseRouter.post("/summarize-file", upload.single("file"), summarizeFile);
courseRouter.post("/generate-flashcards", upload.single("file"), generateFlashcards);
courseRouter.post("/generate-quiz", upload.single("file"), generateQuiz);

export default courseRouter;
