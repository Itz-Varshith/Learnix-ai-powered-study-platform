import { db } from "../config/firebase.js";
import { PrismaClient } from "../../generated/prisma/client.ts";
const prisma = new PrismaClient();

const getEnrolledCourses = async (req, res) => {
  try {
    const uid = req.params.uid;
    const allCourses = await prisma.courseEnrollment.findMany({
      where: {
        userId: uid,
        course: {
          courseType: "Course",
        },
      },
      include: {
        course: {
          select: {
            courseCode: true,
            courseName: true,
            department: true,
            memberCount: true,
          },
        },
      },
    });
    return res.status(200).json({
      success: true,
      message: "Enrolled courses fetched successfully",
      data: allCourses,
    });
  } catch (error) {
    console.error("Error in getting enrolled courses", error);
    return res.status(500).json({
      success: false,
      message: "Error in getting enrolled courses",
      error: error.message,
    });
  }
};

const fetchAllCourses = async (req, res) => {
  try {
    const allCourses = await prisma.course.findMany({
      where: {
        courseType: "Course",
      },
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        department: true,
      },
    });
    return res.status(200).json({
      success: true,
      message: "All courses fetched successfully",
      data: allCourses,
    });
  } catch (error) {
    console.error("Error in fetching all courses", error);
    return res.status(500).json({
      success: false,
      message: "Error in fetching all courses",
      error: error.message,
    });
  }
};

const getFiles = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "CourseId is required",
        data: null,
      });
    }
    const files = await prisma.fileMetaData.findMany({
      where: {
        courseId: courseId,
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        uploadedAt: true,
        uploadedByName: true,
        storedLink: true,
      },
    });
    return res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      data: files,
    });
  } catch (error) {
    console.error("Error in getting files", error);
    return res.status(500).json({
      success: false,
      message: "Error in getting files",
      error: error.message,
    });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { uid } = req.user;
    if (!uid || !courseId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Course ID are required",
        data: null,
      });
    }
    const enrollCourse = await prisma.courseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId: uid,
          courseId: courseId,
        },
      },
      update: {
        userId: uid,
        courseId: courseId,
      },
      create: {
        userId: uid,
        courseId: courseId,
      },
    });
    await prisma.course.update({
      where: { id: courseId },
      data: {
        memberCount: {
          increment: 1,
        },
      },
    });
    if (!enrollCourse) {
      return res.status(400).json({
        success: false,
        message: "Failed to enroll in course",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Student enrolled in course successfully",
      data: enrollCourse,
    });
  } catch (error) {
    console.error("Error in enrolling in course", error);
    return res.status(500).json({
      success: false,
      message: "Error in enrolling in course",
      error: error.message,
    });
  }
};

const uploadFile = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { uid, name } = req.user;

    // Validate required fields
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
        data: null,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
        data: null,
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
        data: null,
      });
    }

    // File info from Cloudinary (via multer-storage-cloudinary)
    const { originalname, size, path: cloudinaryUrl } = req.file;
    console.log(originalname);
    // Get file extension/type
    const fileType = originalname.split(".").pop().toLowerCase();

    // Save metadata to Prisma
    const fileMetadata = await prisma.fileMetaData.create({
      data: {
        fileName: originalname,
        fileType: fileType,
        fileSize: size || 0,
        storedLink: cloudinaryUrl,
        uploadedByName: name,
        courseId: courseId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: fileMetadata,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading file",
      error: error.message,
    });
  }
};

const createCourse = async (req, res) => {
  try {
    let {
      courseCode,
      courseName,
      courseDescription,
      department,
      courseCategory,
      type,
    } = req.body;
    const { uid } = req.user;
    if (!type) {
      type = "Course";
      courseCategory = "Open";
    }
    if (!courseCode || !courseName || !courseDescription || !department) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }
    if (courseCategory !== "Open" && courseCategory !== "Invite_Only") {
      return res.status(400).json({
        success: false,
        message: "Invalid course category",
        data: null,
      });
    }
    if (type !== "Course" && type !== "Study_Group") {
      return res.status(400).json({
        success: false,
        message: "Invalid course type",
        data: null,
      });
    }
    if (type === "Course") {
      const course = await prisma.course.create({
        data: {
          courseCode: courseCode,
          courseName: courseName,
          courseDescription: courseDescription,
          department: department,
          memberCount: 0,
          courseCategory: "Open",
          courseType: type,
        },
      });
      if (!course) {
        return res.status(400).json({
          success: false,
          message: "Failed to create course",
          data: null,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Course created successfully",
        data: course,
      });
    }
    if (type === "Study_Group") {
      const newStudyGroup = await prisma.course.create({
        data: {
          courseCode: courseCode,
          courseName: courseName,
          courseDescription: courseDescription,
          department: department,
          memberCount: 1,
          courseCategory: courseCategory,
          courseType: type,
        },
      });
      if (!newStudyGroup) {
        return res.status(400).json({
          success: false,
          message: "Failed to create study group",
          data: null,
        });
      }
      await prisma.courseEnrollment.create({
        data: {
          userId: uid,
          courseId: newStudyGroup.id,
        },
      });
      await prisma.studyGroupHead.create({
        data: {
          userId: uid,
          studyGroupId: newStudyGroup.id,
        },
      });
      return res.status(200).json({
        success: true,
        message: "Study group created successfully",
        data: newStudyGroup,
      });
    }
  } catch (error) {
    console.error("Error creating course", error);
    return res.status(500).json({
      success: false,
      message: "Error creating course",
      error: error.message,
    });
  }
};

const fetchStudyGroups = async (req, res) => {
  try {
    const studyGroups = await prisma.course.findMany({
      where: {
        courseType: "Study_Group",
        courseCategory: "Open",
      },
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        courseDescription: true,
        department: true,
        memberCount: true,
      },
    });
    return res.status(200).json({
      success: true,
      message: "Study groups fetched successfully",
      data: studyGroups,
    });
  } catch (error) {
    console.error("Error fetching study groups", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching study groups",
      error: error.message,
    });
  }
};

const fetchJoinedStudyGroups = async (req, res) => {
  try {
    const { uid } = req.user;
    const joinedStudyGroups = await prisma.courseEnrollment.findMany({
      where: {
        userId: uid,
        course: {
          courseType: "Study_Group",
        },
      },
      include: {
        course: true,
      },
    });
    return res.status(200).json({
      success: true,
      message: "Joined study groups fetched successfully",
      data: joinedStudyGroups,
    });
  } catch (error) {
    console.error("Error fetching joined study groups", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching joined study groups",
      error: error.message,
    });
  }
};

const addStudyGroupHead = async (req, res) => {
  try {
    const studyGroupId = req.params.studyGroupId;
    const { uid } = req.user;
    const newHeadId = req.body.newHeadId;
    if (!studyGroupId || !uid || !newHeadId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }
    const oldHeadVerification = await prisma.studyGroupHead.findFirst({
      where: {
        studyGroupId: studyGroupId,
        userId: uid,
      },
    });
    if (!oldHeadVerification) {
      return res.status(400).json({
        success: false,
        message: "You are not the head of this study group",
        data: null,
      });
    }
    const newHeadVerification = await prisma.studyGroupHead.findFirst({
      where: {
        userId: newHeadId,
        studyGroupId: studyGroupId,
      },
    });
    if (newHeadVerification) {
      return res.status(400).json({
        success: false,
        message: "The new head is already a head of this study group",
        data: null,
      });
    }
    const newHeadCreation = await prisma.studyGroupHead.create({
      data: {
        userId: newHeadId,
        studyGroupId: studyGroupId,
      },
    });
    if (!newHeadCreation) {
      return res.status(400).json({
        success: false,
        message: "Failed to add new head",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "New head added successfully",
      data: newHeadCreation,
    });
  } catch (error) {
    console.error("Error adding study group head", error);
    return res.status(500).json({
      success: false,
      message: "Error adding study group head",
      error: error.message,
    });
  }
};

const getStudyGroupMembers = async (req, res) => {
  try {
    const studyGroupId = req.params.studyGroupId;
    if (!studyGroupId) {
      return res.status(400).json({
        success: false,
        message: "Study group ID is required",
        data: null,
      });
    }
    const studyGroupMembers = await prisma.courseEnrollment.findMany({
      where: {
        courseId: studyGroupId,
      },
      include: {
        user: true,
      },
    });
    const studyGroupHeads = await prisma.studyGroupHead.findMany({
      where: {
        studyGroupId: studyGroupId,
      },
    });

    const headIds = studyGroupHeads.map((head) => head.userId);

    const finalMembersList = studyGroupMembers.map((member) => {
      return {
        ...member.user,
        isHead: headIds.includes(member.userId),
      };
    });
    console.log(finalMembersList);
    return res.status(200).json({
      success: true,
      message: "Study group members fetched successfully",
      data: finalMembersList,
    });
  } catch (error) {
    console.error("Error getting study group members", error);
    return res.status(500).json({
      success: false,
      message: "Error getting study group members",
      error: error.message,
    });
  }
};

const sendStudyGroupRequest = async (req, res) => {
  try {
    const { uid, name } = req.user;
    const { recieverEmail, message, studyGroupId } = req.body;
    if (!recieverEmail || !message || !uid || !name || !studyGroupId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }
    const recieverId = await prisma.user.findFirst({
      where: {
        email: recieverEmail,
      },
      select: {
        id: true,
      },
    });
    const studyGroup = await prisma.course.findUnique({
      where: {
        id: studyGroupId,
      },
    });
    const headDetails = await prisma.studyGroupHead.findFirst({
      where: {
        studyGroupId: studyGroupId,
        userId: uid,
      },
    });
    if (!headDetails) {
      return res.status(400).json({
        success: false,
        message: "You are not the head of this study group",
        data: null,
      });
    }
    if (!recieverId) {
      return res.status(400).json({
        success: false,
        message: "Reciever/ StudyGroup not found",
        data: null,
      });
    }
    if (!studyGroup) {
      return res.status(400).json({
        success: false,
        message: "Study group not found",
        data: null,
      });
    }
    const newRequest = await prisma.studyGroupRequest.create({
      data: {
        senderId: uid,
        senderName: name,
        recieverId: recieverId.id,
        message: message,
        studyGroupId: studyGroupId,
        studyGroupName: studyGroup.courseName,
        studyGroupCode: studyGroup.courseCode,
        status: "Pending",
      },
    });
    if (!newRequest) {
      return res.status(400).json({
        success: false,
        message: "Failed to send study group request",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Study group request sent successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error sending study group request", error);
    return res.status(500).json({
      success: false,
      message: "Error sending study group request",
      error: error.message,
    });
  }
};

const fetchStudyGroupRequests = async (req, res) => {
  try {
    const { uid } = req.user;
    const studyGroupRequests = await prisma.studyGroupRequest.findMany({
      where: {
        recieverId: uid,
        status: "Pending",
      },
    });
    return res.status(200).json({
      success: true,
      message: "Study group requests fetched successfully",
      data: studyGroupRequests,
    });
  } catch (error) {
    console.error("Error fetching study group requests", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching study group requests",
      error: error.message,
    });
  }
};

const changeStatusForRequest = async (req, res) => {
  try {
    const { uid } = req.user;
    const { requestId, status } = req.body;
    if (!requestId || !status || !uid) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }
    if (status !== "Accepted" && status !== "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        data: null,
      });
    }
    const request = await prisma.studyGroupRequest.findUnique({
      where: {
        id: requestId,
      },
    });
    if (!request) {
      return res.status(400).json({
        success: false,
        message: "Request not found",
        data: null,
      });
    }
    if (request.recieverId !== uid) {
      return res.status(400).json({
        success: false,
        message: "You are not the reciever of this request",
        data: null,
      });
    }
    const updatedRequest = await prisma.studyGroupRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: status,
      },
    });
    if (!updatedRequest) {
      return res.status(400).json({
        success: false,
        message: "Failed to change status for request",
        data: null,
      });
    }
    if (status === "Accepted") {
      const enrollment = await prisma.courseEnrollment.create({
        data: {
          userId: uid,
          courseId: request.studyGroupId,
        },
      });
      if (!enrollment) {
        return res.status(400).json({
          success: false,
          message: "Failed to add sender to study group",
          data: null,
        });
      }
    }
    return res.status(200).json({
      success: true,
      message: "Status changed for request successfully",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error changing status for request", error);
    return res.status(500).json({
      success: false,
      message: "Error changing status for request",
      error: error.message,
    });
  }
};

const summarizeFile = async (req, res) => {
  try {
    const { originalname, size, path: cloudinaryUrl } = req.file;
    const { uid } = req.user;
    const { courseId, userPrompt = "" } = req.body;
    if (!originalname || !size || !cloudinaryUrl || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }
    const fileType = originalname.split(".").pop().toLowerCase();
    if (fileType != "pdf") {
      return res.status(400).json({
        success: false,
        message: "Invalid file type",
        data: null,
      });
    }
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
    });
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
        data: null,
      });
    }
    const response = await fetch("http://localhost:8000/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileURL: cloudinaryUrl,
        user_prompt: userPrompt,
      }),
    });
    const { summary } = await response.json();
    if (!summary) {
      return res.status(400).json({
        success: false,
        message: "Failed to summarize file",
        data: null,
      });
    }
    const fileSummary = await prisma.fileSummary.create({
      data: {
        fileURL: cloudinaryUrl,
        fileName: originalname,
        summary: summary,
        createdById: uid,
        courseId: courseId,
      },
    });
    if (!fileSummary) {
      return res.status(400).json({
        success: false,
        message: "Failed to create file summary",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "File summarized successfully",
      data: fileSummary,
    });
  } catch (error) {
    console.error("Error summarizing file", error);
    return res.status(500).json({
      success: false,
      message: "Error summarizing file",
      error: error.message,
    });
  }
};

const getSummarizedFiles = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { uid } = req.user;
    if (!uid || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }
    const summarizedFiles = await prisma.fileSummary.findMany({
      where: {
        createdById: uid,
        courseId: courseId,
      },
      select: {
        fileURL: true,
        fileName: true,
        summary: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.status(200).json({
      success: true,
      message: "Summarized files fetched successfully",
      data: summarizedFiles,
    });
  } catch (error) {
    console.error("Error getting summarized files", error);
    return res.status(500).json({
      success: false,
      message: "Error getting summarized files",
      error: error.message,
    });
  }
};

const generateFlashcards = async (req, res) => {
  try {
    const { originalname, size, path: cloudinaryUrl } = req.file;
    const { uid } = req.user;
    const { courseId, nCards = 10 } = req.body;

    if (!originalname || !size || !cloudinaryUrl || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    const fileType = originalname.split(".").pop().toLowerCase();
    if (fileType !== "pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are supported",
        data: null,
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
        data: null,
      });
    }

    // Call the ML endpoint
    const response = await fetch("http://localhost:8000/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileURL: cloudinaryUrl,
        n_cards: parseInt(nCards),
      }),
    });

    const { flashcards } = await response.json();

    if (!flashcards || !Array.isArray(flashcards)) {
      return res.status(400).json({
        success: false,
        message: "Failed to generate flashcards",
        data: null,
      });
    }

    // Save to database
    const fileFlashcards = await prisma.fileFlashcards.create({
      data: {
        fileURL: cloudinaryUrl,
        fileName: originalname,
        flashcards: flashcards,
        createdById: uid,
        courseId: courseId,
      },
    });

    if (!fileFlashcards) {
      return res.status(400).json({
        success: false,
        message: "Failed to save flashcards",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Flashcards generated successfully",
      data: fileFlashcards,
    });
  } catch (error) {
    console.error("Error generating flashcards", error);
    return res.status(500).json({
      success: false,
      message: "Error generating flashcards",
      error: error.message,
    });
  }
};

const getFlashcardsHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { uid } = req.user;

    if (!uid || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    const flashcardsHistory = await prisma.fileFlashcards.findMany({
      where: {
        createdById: uid,
        courseId: courseId,
      },
      select: {
        id: true,
        fileURL: true,
        fileName: true,
        flashcards: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Flashcards history fetched successfully",
      data: flashcardsHistory,
    });
  } catch (error) {
    console.error("Error fetching flashcards history", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching flashcards history",
      error: error.message,
    });
  }
};

const generateQuiz = async (req, res) => {
  try {
    const { originalname, size, path: cloudinaryUrl } = req.file;
    const { uid } = req.user;
    const { courseId, nQuestions = 5 } = req.body;

    if (!originalname || !size || !cloudinaryUrl || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    const fileType = originalname.split(".").pop().toLowerCase();
    if (fileType !== "pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are supported",
        data: null,
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
        data: null,
      });
    }

    // Call the ML endpoint
    const response = await fetch("http://localhost:8000/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileURL: cloudinaryUrl,
        n_questions: parseInt(nQuestions),
      }),
    });
    const responseData = await response.json();
    const { quiz } = responseData;

    if (!quiz || !Array.isArray(quiz)) {
      return res.status(400).json({
        success: false,
        message: "Failed to generate quiz",
        data: null,
      });
    }

    // Save to database
    const fileQuiz = await prisma.fileQuiz.create({
      data: {
        fileURL: cloudinaryUrl,
        fileName: originalname,
        questions: quiz,
        createdById: uid,
        courseId: courseId,
      },
    });

    if (!fileQuiz) {
      return res.status(400).json({
        success: false,
        message: "Failed to save quiz",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quiz generated successfully",
      data: fileQuiz,
    });
  } catch (error) {
    console.error("Error generating quiz", error);
    return res.status(500).json({
      success: false,
      message: "Error generating quiz",
      error: error.message,
    });
  }
};

const getQuizHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { uid } = req.user;

    if (!uid || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    const quizHistory = await prisma.fileQuiz.findMany({
      where: {
        createdById: uid,
        courseId: courseId,
      },
      select: {
        id: true,
        fileURL: true,
        fileName: true,
        questions: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Quiz history fetched successfully",
      data: quizHistory,
    });
  } catch (error) {
    console.error("Error fetching quiz history", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching quiz history",
      error: error.message,
    });
  }
};

const replyTaggedMessage = async (req, res) => {
  try {
    const {
      messageString,
      courseId
    } = req.body;
    const { uid, name } = req.user;

    if (!messageString) {
      return res.status(400).json({
        success: false,
        message: "Message string is required",
        data: null,
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
        data: null,
      });
    }

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    const userMessage = await prisma.chatMessage.create({
      data: {
        courseId: courseId,
        senderId: uid,
        senderName: name,
        content: messageString,
      },
    });

    let memory = await prisma.groupChatAIContext.findUnique({
      where: {
        courseId: courseId,
      },
      select: {
        memory: true,
      },
    })
    if(!memory) {
      memory = "This is the start of a conversation with the user, and the user is asking for academic assistance";
    }
    const response = await fetch("http://localhost:8000/mention", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: messageString,
        memory: memory,
      }),
    });

    const responseData = await response.json();

    if (!responseData || !responseData.response || !responseData.summary) {
      return res.status(400).json({
        success: false,
        message: "Failed to get AI response",
        data: null,
      });
    }

    const aiMessage = await prisma.chatMessage.create({
      data: {
        courseId: courseId,
        senderId: "Bot_Account",
        senderName: "Learnix",
        content: responseData.response,
      },
    });
    const updatedMemory = await prisma.groupChatAIContext.upsert({
      where: {
        courseId: courseId,
      },
      update: {
        memory: responseData.summary
      },
      create: {
        courseId: courseId,
        memory: responseData.summary
      }
    })
    return res.status(200).json({
      success: true,
      message: "AI response generated successfully",
      data: {
        userMessage: userMessage,
        aiMessage: aiMessage,
      }
    });
  } catch (error) {
    console.error("Error replying to tagged message", error);
    return res.status(500).json({
      success: false,
      message: "Error getting AI response",
      error: error.message,
    });
  }
};

export {
  getEnrolledCourses,
  fetchAllCourses,
  getFiles,
  enrollInCourse,
  uploadFile,
  summarizeFile,
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
  getSummarizedFiles,
  replyTaggedMessage,
};
