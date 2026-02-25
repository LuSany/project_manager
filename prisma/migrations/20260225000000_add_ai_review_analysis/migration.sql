-- CreateTable
CREATE TABLE "ReviewAiAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "aiConfigId" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewAiAnalysis_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReviewAiAnalysis_reviewId_analysisType_idx" ON "ReviewAiAnalysis"("reviewId", "analysisType");
