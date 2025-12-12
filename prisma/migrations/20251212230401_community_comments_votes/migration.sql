-- CreateTable
CREATE TABLE "CommunityDealComment" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityDealComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityDealVote" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityDealVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityDealComment_dealId_idx" ON "CommunityDealComment"("dealId");

-- CreateIndex
CREATE INDEX "CommunityDealComment_userId_idx" ON "CommunityDealComment"("userId");

-- CreateIndex
CREATE INDEX "CommunityDealComment_createdAt_idx" ON "CommunityDealComment"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityDealVote_dealId_idx" ON "CommunityDealVote"("dealId");

-- CreateIndex
CREATE INDEX "CommunityDealVote_userId_idx" ON "CommunityDealVote"("userId");

-- CreateIndex
CREATE INDEX "CommunityDealVote_value_idx" ON "CommunityDealVote"("value");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityDealVote_dealId_userId_key" ON "CommunityDealVote"("dealId", "userId");

-- AddForeignKey
ALTER TABLE "CommunityDealComment" ADD CONSTRAINT "CommunityDealComment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CommunityDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityDealComment" ADD CONSTRAINT "CommunityDealComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityDealVote" ADD CONSTRAINT "CommunityDealVote_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CommunityDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityDealVote" ADD CONSTRAINT "CommunityDealVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
