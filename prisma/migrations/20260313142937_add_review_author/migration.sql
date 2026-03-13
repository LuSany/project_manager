-- AlterTable
-- 先添加可空列
ALTER TABLE "reviews" ADD COLUMN "authorId" TEXT;

-- 用项目所有者的ID填充现有评审的authorId
UPDATE "reviews" r SET "authorId" = p."ownerId" FROM "projects" p WHERE r."projectId" = p."id";

-- 设置为非空
ALTER TABLE "reviews" ALTER COLUMN "authorId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "reviews_authorId_idx" ON "reviews"("authorId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
