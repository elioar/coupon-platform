-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'REGISTERED', 'ACTIVE');

-- CreateTable
CREATE TABLE "BusinessInvite" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "invitedBusinessId" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "rewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessInvite_inviterId_idx" ON "BusinessInvite"("inviterId");

-- CreateIndex
CREATE INDEX "BusinessInvite_invitedBusinessId_idx" ON "BusinessInvite"("invitedBusinessId");

-- CreateIndex
CREATE INDEX "BusinessInvite_status_idx" ON "BusinessInvite"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInvite_inviterId_invitedBusinessId_key" ON "BusinessInvite"("inviterId", "invitedBusinessId");

-- AddForeignKey
ALTER TABLE "BusinessInvite" ADD CONSTRAINT "BusinessInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInvite" ADD CONSTRAINT "BusinessInvite_invitedBusinessId_fkey" FOREIGN KEY ("invitedBusinessId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
