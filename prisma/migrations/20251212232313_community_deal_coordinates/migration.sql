-- AlterTable
ALTER TABLE "CommunityDeal" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "CommunityDeal_latitude_longitude_idx" ON "CommunityDeal"("latitude", "longitude");
