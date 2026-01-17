/*
  Warnings:

  - You are about to drop the column `uploadedBy` on the `fileMetaData` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('Course', 'Study_Group');

-- CreateEnum
CREATE TYPE "courseCategoryEnum" AS ENUM ('Open', 'Invite_Only');

-- CreateEnum
CREATE TYPE "StudyGroupRequestStatus" AS ENUM ('Pending', 'Accepted', 'Rejected');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "courseCategory" "courseCategoryEnum" NOT NULL DEFAULT 'Open',
ADD COLUMN     "courseType" "CourseType" NOT NULL DEFAULT 'Course',
ALTER COLUMN "memberCount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "fileMetaData" DROP COLUMN "uploadedBy",
ADD COLUMN     "uploadedByName" TEXT NOT NULL DEFAULT 'Unknown User';

-- CreateTable
CREATE TABLE "StudyGroupRequest" (
    "id" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recieverId" TEXT NOT NULL,
    "status" "StudyGroupRequestStatus" NOT NULL DEFAULT 'Pending',
    "message" TEXT,
    "courseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroupRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudyGroupRequest" ADD CONSTRAINT "StudyGroupRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupRequest" ADD CONSTRAINT "StudyGroupRequest_recieverId_fkey" FOREIGN KEY ("recieverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupRequest" ADD CONSTRAINT "StudyGroupRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
