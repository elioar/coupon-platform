-- CreateEnum
CREATE TYPE "DealPriceType" AS ENUM ('EUR', 'PERCENT', 'ONE_PLUS_ONE', 'TWO_PLUS_ONE', 'FREE', 'OTHER');

-- CreateEnum
CREATE TYPE "DealOrigin" AS ENUM ('GR', 'INTERNATIONAL');

-- AlterTable
ALTER TABLE "CommunityDeal" ADD COLUMN     "link" TEXT,
ADD COLUMN     "priceValue" TEXT,
ADD COLUMN     "priceType" "DealPriceType",
ADD COLUMN     "merchantName" TEXT,
ADD COLUMN     "origin" "DealOrigin" DEFAULT 'GR',
ADD COLUMN     "startsAt" TIMESTAMP(3),
ADD COLUMN     "extraInfo" TEXT,
ADD COLUMN     "redeemSteps" TEXT;
