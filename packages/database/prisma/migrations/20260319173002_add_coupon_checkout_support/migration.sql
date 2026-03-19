/*
  Warnings:
*/
-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "discountType" "CouponDiscountType";

-- Backfill existing coupons to the legacy percentage semantics before enforcing NOT NULL.
UPDATE "coupons"
SET "discountType" = 'PERCENTAGE'
WHERE "discountType" IS NULL;

-- AlterTable
ALTER TABLE "coupons" ALTER COLUMN "discountType" SET NOT NULL;

-- AlterTable
ALTER TABLE "order_quotes" ADD COLUMN     "couponId" TEXT;

-- AddForeignKey
ALTER TABLE "order_quotes" ADD CONSTRAINT "order_quotes_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
