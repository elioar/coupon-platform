-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DealSourceType" AS ENUM ('USER', 'AI');

-- AlterTable
ALTER TABLE "CommunityDeal" ADD COLUMN     "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByAdminId" TEXT,
ADD COLUMN     "sourceType" "DealSourceType" NOT NULL DEFAULT 'USER',
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "CommunityDeal_reviewStatus_idx" ON "CommunityDeal"("reviewStatus");

-- CreateIndex
CREATE INDEX "CommunityDeal_sourceType_idx" ON "CommunityDeal"("sourceType");

-- AddForeignKey
ALTER TABLE "CommunityDeal" ADD CONSTRAINT "CommunityDeal_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
