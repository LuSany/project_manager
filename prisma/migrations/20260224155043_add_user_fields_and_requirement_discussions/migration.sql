-- AlterTable
ALTER TABLE "users" ADD COLUMN "department" TEXT;
ALTER TABLE "users" ADD COLUMN "position" TEXT;

-- CreateTable
CREATE TABLE "requirement_discussions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "taskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "requirement_discussions_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "requirement_discussions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "requirement_discussions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "requirement_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "requirement_history_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "requirementId" TEXT,
    "autoClose" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "issues_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "issues_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_issues" ("autoClose", "createdAt", "description", "id", "priority", "projectId", "resolvedAt", "status", "title", "updatedAt") SELECT "autoClose", "createdAt", "description", "id", "priority", "projectId", "resolvedAt", "status", "title", "updatedAt" FROM "issues";
DROP TABLE "issues";
ALTER TABLE "new_issues" RENAME TO "issues";
CREATE INDEX "issues_projectId_idx" ON "issues"("projectId");
CREATE INDEX "issues_status_idx" ON "issues"("status");
CREATE INDEX "issues_priority_idx" ON "issues"("priority");
CREATE INDEX "issues_requirementId_idx" ON "issues"("requirementId");
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "estimatedHours" REAL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "issueId" TEXT,
    "acceptorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issues" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_acceptorId_fkey" FOREIGN KEY ("acceptorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("createdAt", "description", "dueDate", "estimatedHours", "id", "issueId", "milestoneId", "priority", "progress", "projectId", "startDate", "status", "title", "updatedAt") SELECT "createdAt", "description", "dueDate", "estimatedHours", "id", "issueId", "milestoneId", "priority", "progress", "projectId", "startDate", "status", "title", "updatedAt" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId");
CREATE INDEX "tasks_milestoneId_idx" ON "tasks"("milestoneId");
CREATE INDEX "tasks_issueId_idx" ON "tasks"("issueId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX "tasks_acceptorId_idx" ON "tasks"("acceptorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "requirement_discussions_requirementId_idx" ON "requirement_discussions"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_discussions_userId_idx" ON "requirement_discussions"("userId");

-- CreateIndex
CREATE INDEX "requirement_history_requirementId_idx" ON "requirement_history"("requirementId");

-- CreateIndex
CREATE INDEX "requirement_history_changeType_idx" ON "requirement_history"("changeType");
