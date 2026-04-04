-- AlterTable
ALTER TABLE "file_storage" ADD COLUMN     "documentKey" TEXT;
ALTER TABLE "file_storage" ADD COLUMN     "lockExpiresAt" TIMESTAMP(3);
ALTER TABLE "file_storage" ADD COLUMN     "lockedAt" TIMESTAMP(3);
ALTER TABLE "file_storage" ADD COLUMN     "lockedBy" TEXT;
ALTER TABLE "file_storage" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "file_storage" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "file_storage_documentKey_idx" ON "file_storage"("documentKey");
CREATE INDEX "file_storage_lockedBy_idx" ON "file_storage"("lockedBy");

-- AddForeignKey
ALTER TABLE "file_storage" ADD CONSTRAINT "file_storage_lockedBy_fkey" FOREIGN KEY ("lockedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
