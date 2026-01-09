-- CreateTable
CREATE TABLE "fileFlashcards" (
    "id" TEXT NOT NULL,
    "fileURL" TEXT NOT NULL,
    "fileName" TEXT NOT NULL DEFAULT 'Unknown File',
    "flashcards" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fileFlashcards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fileFlashcards_createdById_courseId_idx" ON "fileFlashcards"("createdById", "courseId");

-- AddForeignKey
ALTER TABLE "fileFlashcards" ADD CONSTRAINT "fileFlashcards_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fileFlashcards" ADD CONSTRAINT "fileFlashcards_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
