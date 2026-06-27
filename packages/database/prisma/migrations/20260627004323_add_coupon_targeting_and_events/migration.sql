-- CreateEnum
CREATE TYPE "CouponEventType" AS ENUM ('created', 'disabled', 'validation_failed', 'eligibility_failed', 'usage_limit_failed', 'applied_at_checkout', 'confirmed_by_payment');

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "allowedEmails" TEXT[],
ADD COLUMN     "allowedQueues" TEXT[],
ADD COLUMN     "allowedServiceTypes" "ServiceType"[],
ADD COLUMN     "globalUsageLimit" INTEGER,
ADD COLUMN     "maxRankIndex" INTEGER,
ADD COLUMN     "maxSubtotal" INTEGER,
ADD COLUMN     "minExtrasCount" INTEGER,
ADD COLUMN     "minRankIndex" INTEGER,
ADD COLUMN     "minSubtotal" INTEGER,
ADD COLUMN     "perUserUsageLimit" INTEGER,
ADD COLUMN     "requiredExtra" TEXT;

-- CreateTable
CREATE TABLE "coupon_events" (
    "id" TEXT NOT NULL,
    "couponId" TEXT,
    "code" TEXT NOT NULL,
    "type" "CouponEventType" NOT NULL,
    "clientId" TEXT,
    "orderId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coupon_events_couponId_type_idx" ON "coupon_events"("couponId", "type");

-- CreateIndex
CREATE INDEX "coupon_events_type_createdAt_idx" ON "coupon_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "coupon_events_code_idx" ON "coupon_events"("code");

-- AddForeignKey
ALTER TABLE "coupon_events" ADD CONSTRAINT "coupon_events_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
