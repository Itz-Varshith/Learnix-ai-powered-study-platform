-- CreateTable
CREATE TABLE "StudyGroupHead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studyGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroupHead_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudyGroupHead" ADD CONSTRAINT "StudyGroupHead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupHead" ADD CONSTRAINT "StudyGroupHead_studyGroupId_fkey" FOREIGN KEY ("studyGroupId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
