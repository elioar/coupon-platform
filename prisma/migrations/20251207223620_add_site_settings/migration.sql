-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "useRealStats" BOOLEAN NOT NULL DEFAULT true,
    "fakeTotalCoupons" INTEGER NOT NULL DEFAULT 0,
    "fakeActiveMembers" INTEGER NOT NULL DEFAULT 0,
    "fakeTotalBusinesses" INTEGER NOT NULL DEFAULT 0,
    "fakeTotalSavings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
