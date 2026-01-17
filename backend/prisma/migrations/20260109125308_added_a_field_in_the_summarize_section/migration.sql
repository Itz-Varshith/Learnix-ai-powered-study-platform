/*
  Warnings:

  - Added the required column `courseId` to the `fileSummary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "fileSummary" ADD COLUMN     "courseId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "fileSummary" ADD CONSTRAINT "fileSummary_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
