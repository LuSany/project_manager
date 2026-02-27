/*
  Warnings:

  - You are about to drop the `review_type_configs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "review_type_configs_isActive_idx";

-- DropIndex
DROP INDEX "review_type_configs_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "review_type_configs";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ReviewTypeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "review_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "review_templates_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ReviewTypeConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "review_template_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "review_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "reviews_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ReviewTypeConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_reviews" ("createdAt", "description", "id", "passedCriteria", "projectId", "scheduledAt", "status", "title", "totalScore", "typeId", "updatedAt") SELECT "createdAt", "description", "id", "passedCriteria", "projectId", "scheduledAt", "status", "title", "totalScore", "typeId", "updatedAt" FROM "reviews";
DROP TABLE "reviews";
ALTER TABLE "new_reviews" RENAME TO "reviews";
CREATE INDEX "reviews_projectId_idx" ON "reviews"("projectId");
CREATE INDEX "reviews_typeId_idx" ON "reviews"("typeId");
CREATE INDEX "reviews_status_idx" ON "reviews"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ReviewTypeConfig_name_key" ON "ReviewTypeConfig"("name");

-- CreateIndex
CREATE INDEX "review_templates_typeId_idx" ON "review_templates"("typeId");

-- CreateIndex
CREATE INDEX "review_templates_isActive_idx" ON "review_templates"("isActive");

-- CreateIndex
CREATE INDEX "review_template_items_templateId_idx" ON "review_template_items"("templateId");
