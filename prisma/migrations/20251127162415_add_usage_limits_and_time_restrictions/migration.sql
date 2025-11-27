-- CreateEnum
CREATE TYPE "UsageLimitType" AS ENUM ('SINGLE_USE', 'MULTIPLE_USE', 'UNLIMITED');

-- DropIndex
DROP INDEX "CouponRedemption_couponId_userId_key";

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "hasTimeRestrictions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxUsesPerUser" INTEGER,
ADD COLUMN     "usageLimitType" "UsageLimitType" NOT NULL DEFAULT 'SINGLE_USE',
ADD COLUMN     "validDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "validEndHour" INTEGER,
ADD COLUMN     "validStartHour" INTEGER;

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_userId_idx" ON "CouponRedemption"("couponId", "userId");
