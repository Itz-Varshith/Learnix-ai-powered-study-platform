/*
  Warnings:

  - You are about to drop the column `courseCode` on the `StudyGroupRequest` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `StudyGroupRequest` table. All the data in the column will be lost.
  - You are about to drop the column `courseName` on the `StudyGroupRequest` table. All the data in the column will be lost.
  - Added the required column `studyGroupCode` to the `StudyGroupRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studyGroupId` to the `StudyGroupRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studyGroupName` to the `StudyGroupRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StudyGroupRequest" DROP CONSTRAINT "StudyGroupRequest_courseId_fkey";

-- AlterTable
ALTER TABLE "StudyGroupRequest" DROP COLUMN "courseCode",
DROP COLUMN "courseId",
DROP COLUMN "courseName",
ADD COLUMN     "studyGroupCode" TEXT NOT NULL,
ADD COLUMN     "studyGroupId" TEXT NOT NULL,
ADD COLUMN     "studyGroupName" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "StudyGroupRequest" ADD CONSTRAINT "StudyGroupRequest_studyGroupId_fkey" FOREIGN KEY ("studyGroupId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
