-- CreateTable
CREATE TABLE "fileMetaData" (
    "id" TEXT NOT NULL,
    "storedLink" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "fileMetaData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fileMetaData" ADD CONSTRAINT "fileMetaData_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
