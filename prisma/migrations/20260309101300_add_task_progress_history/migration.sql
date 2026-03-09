-- CreateTable
CREATE TABLE "task_progress_history" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "status" TEXT,
    "comment" TEXT,
    "previousProgress" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_progress_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_progress_history_taskId_idx" ON "task_progress_history"("taskId");

-- CreateIndex
CREATE INDEX "task_progress_history_userId_idx" ON "task_progress_history"("userId");

-- AddForeignKey
ALTER TABLE "task_progress_history" ADD CONSTRAINT "task_progress_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_progress_history" ADD CONSTRAINT "task_progress_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
