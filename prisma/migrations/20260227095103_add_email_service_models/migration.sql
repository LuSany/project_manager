/*
  Warnings:

  - You are about to drop the `ReviewAiAnalysis` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ReviewAiAnalysis";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "review_ai_analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "aiConfigId" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "review_ai_analysis_reviewId_analysisType_idx" ON "review_ai_analysis"("reviewId", "analysisType");
