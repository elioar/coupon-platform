-- AlterTable
ALTER TABLE "User" ADD COLUMN     "about" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "businessCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "businessDescription" TEXT,
ADD COLUMN     "businessFacebook" TEXT,
ADD COLUMN     "businessInstagram" TEXT,
ADD COLUMN     "businessLocation" TEXT,
ADD COLUMN     "businessTikTok" TEXT,
ADD COLUMN     "businessWebsite" TEXT,
ADD COLUMN     "phone" TEXT;
