-- AlterTable
ALTER TABLE "review_materials" ADD COLUMN     "uploaderId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "review_materials" ADD CONSTRAINT "review_materials_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "review_materials_uploaderId_idx" ON "review_materials"("uploaderId");
