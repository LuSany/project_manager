-- CreateTable
CREATE TABLE "risks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "probability" INTEGER NOT NULL DEFAULT 1,
    "impact" INTEGER NOT NULL DEFAULT 1,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "mitigation" TEXT,
    "contingency" TEXT,
    "ownerId" TEXT NOT NULL,
    "isAiIdentified" BOOLEAN NOT NULL DEFAULT false,
    "aiRiskScore" REAL,
    "aiSuggestion" TEXT,
    "identifiedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "resolvedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "risks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risk_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riskId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'RELATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_tasks_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "risks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "risk_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "risks_projectId_idx" ON "risks"("projectId");

-- CreateIndex
CREATE INDEX "risks_status_idx" ON "risks"("status");

-- CreateIndex
CREATE INDEX "risks_riskLevel_idx" ON "risks"("riskLevel");

-- CreateIndex
CREATE INDEX "risk_tasks_riskId_idx" ON "risk_tasks"("riskId");

-- CreateIndex
CREATE INDEX "risk_tasks_taskId_idx" ON "risk_tasks"("taskId");
