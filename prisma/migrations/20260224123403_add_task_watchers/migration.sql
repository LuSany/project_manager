/*
  Warnings:

  - You are about to drop the `task_dependencies` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "task_dependencies_dependsOnId_idx";

-- DropIndex
DROP INDEX "task_dependencies_taskId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "task_dependencies";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "projectId" TEXT NOT NULL,
    "autoClose" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "issues_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_issues" ("createdAt", "description", "id", "priority", "projectId", "status", "title", "updatedAt") SELECT "createdAt", "description", "id", "priority", "projectId", "status", "title", "updatedAt" FROM "issues";
DROP TABLE "issues";
ALTER TABLE "new_issues" RENAME TO "issues";
CREATE INDEX "issues_projectId_idx" ON "issues"("projectId");
CREATE INDEX "issues_status_idx" ON "issues"("status");
CREATE INDEX "issues_priority_idx" ON "issues"("priority");
CREATE TABLE "new_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "scheduledAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "passedCriteria" INTEGER NOT NULL DEFAULT 0,
    "totalScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "review_type_configs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_reviews" ("createdAt", "description", "id", "projectId", "scheduledAt", "status", "title", "typeId", "updatedAt") SELECT "createdAt", "description", "id", "projectId", "scheduledAt", "status", "title", "typeId", "updatedAt" FROM "reviews";
DROP TABLE "reviews";
ALTER TABLE "new_reviews" RENAME TO "reviews";
CREATE INDEX "reviews_projectId_idx" ON "reviews"("projectId");
CREATE INDEX "reviews_typeId_idx" ON "reviews"("typeId");
CREATE INDEX "reviews_status_idx" ON "reviews"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
