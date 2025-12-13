-- AlterTable
ALTER TABLE "CommunityDeal" ADD COLUMN     "seedGroupId" TEXT;

-- CreateIndex
CREATE INDEX "CommunityDeal_seedGroupId_idx" ON "CommunityDeal"("seedGroupId");
