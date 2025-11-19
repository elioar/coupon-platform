-- CreateTable
CREATE TABLE "CouponAnalytics" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CouponAnalytics_couponId_idx" ON "CouponAnalytics"("couponId");

-- CreateIndex
CREATE INDEX "CouponAnalytics_eventType_idx" ON "CouponAnalytics"("eventType");

-- CreateIndex
CREATE INDEX "CouponAnalytics_createdAt_idx" ON "CouponAnalytics"("createdAt");

-- CreateIndex
CREATE INDEX "CouponAnalytics_userId_idx" ON "CouponAnalytics"("userId");

-- AddForeignKey
ALTER TABLE "CouponAnalytics" ADD CONSTRAINT "CouponAnalytics_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
