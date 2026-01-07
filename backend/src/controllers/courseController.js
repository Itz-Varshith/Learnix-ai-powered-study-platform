import { db } from "../config/firebase.js";
import { PrismaClient } from "../../generated/prisma/client.ts";
const prisma = new PrismaClient();

const getEnrolledCourses = async (req, res) => {
  try {
    const uid = req.params.uid;
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const allCourses = await prisma.courseEnrollment.findMany({
      where: {
        userId: uid,
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
      where:{
        courseType: "Course"
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

const solveDoubt = async (req, res) => {};
const getFlashcards = async (req, res) => {};
const getQuiz = async (req, res) => {};

const createCourse = async (req, res) => {
    try {
        const {courseCode, courseName, courseDescription, department, courseCategory, type} = req.body;
        const { uid } = req.user;
        if(!courseCode || !courseName || !courseDescription || !department || !courseCategory || !type) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
                data: null,
            })
        }
        if(courseCategory !== "Open" && courseCategory !== "Invite_Only") {
            return res.status(400).json({
                success: false,
                message: "Invalid course category",
                data: null,
            })
        }
        if(type !== "Course" && type !== "Study_Group") {
            return res.status(400).json({
                success: false,
                message: "Invalid course type",
                data: null,
            })
        }
        if(type==="Course"){
          const course = await prisma.course.create({
            data: {
                courseCode: courseCode,
                courseName: courseName,
                courseDescription: courseDescription,
                department: department,
                memberCount: 0,
                courseCategory: "Open",
                courseType: type,
            }
        })
        if(!course) {
            return res.status(400).json({
                success: false,
                message: "Failed to create course",
                data: null,
            })
        }
        return res.status(200).json({
            success: true,
            message: "Course created successfully",
            data: course,
        })
        }
        if(type==="Study_Group"){
          const newStudyGroup = await prisma.course.create({
            data: {
                courseCode: courseCode,
                courseName: courseName,
                courseDescription: courseDescription,
                department: department,
                memberCount: 1,
                courseCategory: courseCategory,
                courseType: type,
            }
          })
          if(!newStudyGroup) {
            return res.status(400).json({
              success: false,
              message: "Failed to create study group",
              data: null,
            })
          }
          await prisma.courseEnrollment.create({
            data: {
              userId: uid,
              courseId: newStudyGroup.id,
            }
          })
          return res.status(200).json({
            success: true,
            message: "Study group created successfully",
            data: newStudyGroup,
          })
        }
    } catch (error) {
        console.error("Error creating course", error);
        return res.status(500).json({
            success: false,
            message: "Error creating course",
            error: error.message,
        })
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
      }
    })
    return res.status(200).json({
      success: true,
      message: "Study groups fetched successfully",
      data: studyGroups,
    })
  } catch (error) {
    console.error("Error fetching study groups", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching study groups",
      error: error.message,
    })
  }
}

export {
  getEnrolledCourses,
  fetchAllCourses,
  getFiles,
  enrollInCourse,
  uploadFile,
  solveDoubt,
  getFlashcards,
  getQuiz,
  createCourse,
};
