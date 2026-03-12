-- AlterEnum
ALTER TYPE "ReviewParticipantRole" ADD VALUE 'MODERATOR';

-- CreateTable
CREATE TABLE "review_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "review_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ReviewParticipantRole" NOT NULL DEFAULT 'REVIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_groups_createdById_idx" ON "review_groups"("createdById");

-- CreateIndex
CREATE INDEX "review_groups_isActive_idx" ON "review_groups"("isActive");

-- CreateIndex
CREATE INDEX "review_group_members_groupId_idx" ON "review_group_members"("groupId");

-- CreateIndex
CREATE INDEX "review_group_members_userId_idx" ON "review_group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "review_group_members_groupId_userId_key" ON "review_group_members"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "review_group_members" ADD CONSTRAINT "review_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "review_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_group_members" ADD CONSTRAINT "review_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
