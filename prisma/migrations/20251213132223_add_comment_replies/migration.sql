-- AlterTable
ALTER TABLE "CommunityDealComment" ADD COLUMN     "parentCommentId" TEXT;

-- CreateIndex
CREATE INDEX "CommunityDealComment_parentCommentId_idx" ON "CommunityDealComment"("parentCommentId");

-- AddForeignKey
ALTER TABLE "CommunityDealComment" ADD CONSTRAINT "CommunityDealComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "CommunityDealComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
