-- CreateEnum
CREATE TYPE "CommunityDealStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REPORTED');

-- CreateTable
CREATE TABLE "CommunityDeal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "CommunityDealStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "CommunityDeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityDeal_userId_idx" ON "CommunityDeal"("userId");

-- CreateIndex
CREATE INDEX "CommunityDeal_status_idx" ON "CommunityDeal"("status");

-- CreateIndex
CREATE INDEX "CommunityDeal_expiresAt_idx" ON "CommunityDeal"("expiresAt");

-- CreateIndex
CREATE INDEX "CommunityDeal_category_idx" ON "CommunityDeal"("category");

-- AddForeignKey
ALTER TABLE "CommunityDeal" ADD CONSTRAINT "CommunityDeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
