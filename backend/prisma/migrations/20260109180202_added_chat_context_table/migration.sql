-- CreateTable
CREATE TABLE "groupChatAIContext" (
    "courseId" TEXT NOT NULL,
    "memory" TEXT NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groupChatAIContext_pkey" PRIMARY KEY ("courseId")
);

-- CreateIndex
CREATE INDEX "groupChatAIContext_courseId_idx" ON "groupChatAIContext"("courseId");

-- AddForeignKey
ALTER TABLE "groupChatAIContext" ADD CONSTRAINT "groupChatAIContext_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
