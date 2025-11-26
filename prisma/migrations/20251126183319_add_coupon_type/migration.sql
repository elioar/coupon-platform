-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('ONLINE_CODE', 'QR_CODE');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "couponType" "CouponType" NOT NULL DEFAULT 'ONLINE_CODE',
ALTER COLUMN "code" DROP NOT NULL;
