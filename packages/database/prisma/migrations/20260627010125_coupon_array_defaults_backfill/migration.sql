-- Backfill rows created before the targeting columns existed (added without a default).
UPDATE "coupons" SET "allowedServiceTypes" = ARRAY[]::"ServiceType"[] WHERE "allowedServiceTypes" IS NULL;
UPDATE "coupons" SET "allowedQueues" = ARRAY[]::TEXT[] WHERE "allowedQueues" IS NULL;
UPDATE "coupons" SET "allowedEmails" = ARRAY[]::TEXT[] WHERE "allowedEmails" IS NULL;

-- AlterTable
ALTER TABLE "coupons" ALTER COLUMN "allowedEmails" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "allowedQueues" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "allowedServiceTypes" SET DEFAULT ARRAY[]::"ServiceType"[];
