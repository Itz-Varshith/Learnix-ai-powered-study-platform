/*
  Warnings:

  - The primary key for the `fileSummary` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `fileSummary` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "fileSummary" DROP CONSTRAINT "fileSummary_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "fileSummary_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "fileQuiz" (
    "id" TEXT NOT NULL,
    "fileURL" TEXT NOT NULL,
    "fileName" TEXT NOT NULL DEFAULT 'Unknown File',
    "questions" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fileQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fileQuiz_createdById_courseId_idx" ON "fileQuiz"("createdById", "courseId");

-- CreateIndex
CREATE INDEX "fileSummary_createdById_courseId_idx" ON "fileSummary"("createdById", "courseId");

-- AddForeignKey
ALTER TABLE "fileQuiz" ADD CONSTRAINT "fileQuiz_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fileQuiz" ADD CONSTRAINT "fileQuiz_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
