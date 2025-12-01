-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED', 'BOGO_1_1', 'BOGO_2_1');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENT',
ALTER COLUMN "discountPercentage" DROP NOT NULL;
