-- CreateEnum
CREATE TYPE "PricingVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "pricing_versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PricingVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_steps" (
    "id" TEXT NOT NULL,
    "pricingVersionId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "league" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "priceToNext" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "pricing_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_extras" (
    "id" TEXT NOT NULL,
    "pricingVersionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modifierRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "pricing_extras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_versions_status_idx" ON "pricing_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_versions_single_active_key"
ON "pricing_versions"("status")
WHERE "status" = 'ACTIVE';

-- Seed bootstrap pricing version so existing quotes and orders can be backfilled
INSERT INTO "pricing_versions" ("id", "name", "status", "activatedAt", "createdAt", "updatedAt")
VALUES (
    'pricing-version-bootstrap-static',
    'Bootstrap static pricing',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "pricing_steps" ("id", "pricingVersionId", "serviceType", "league", "division", "priceToNext")
VALUES
    ('pricing-step-elo-iron-iv', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'iron', 'IV', 8.4),
    ('pricing-step-elo-iron-iii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'iron', 'III', 8.4),
    ('pricing-step-elo-iron-ii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'iron', 'II', 8.4),
    ('pricing-step-elo-iron-i', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'iron', 'I', 8.4),
    ('pricing-step-elo-bronze-iv', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'bronze', 'IV', 9.8),
    ('pricing-step-elo-bronze-iii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'bronze', 'III', 9.8),
    ('pricing-step-elo-bronze-ii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'bronze', 'II', 9.8),
    ('pricing-step-elo-bronze-i', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'bronze', 'I', 9.8),
    ('pricing-step-elo-silver-iv', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'silver', 'IV', 13.3),
    ('pricing-step-elo-silver-iii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'silver', 'III', 13.3),
    ('pricing-step-elo-silver-ii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'silver', 'II', 13.3),
    ('pricing-step-elo-silver-i', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'silver', 'I', 13.3),
    ('pricing-step-elo-gold-iv', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'gold', 'IV', 16.8),
    ('pricing-step-elo-gold-iii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'gold', 'III', 16.8),
    ('pricing-step-elo-gold-ii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'gold', 'II', 16.8),
    ('pricing-step-elo-gold-i', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'gold', 'I', 16.8),
    ('pricing-step-elo-platinum-iv', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'platinum', 'IV', 23.8),
    ('pricing-step-elo-platinum-iii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'platinum', 'III', 23.8),
    ('pricing-step-elo-platinum-ii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'platinum', 'II', 23.8),
    ('pricing-step-elo-platinum-i', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'platinum', 'I', 23.8),
    ('pricing-step-elo-emerald-iv', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'emerald', 'IV', 46.9),
    ('pricing-step-elo-emerald-iii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'emerald', 'III', 46.9),
    ('pricing-step-elo-emerald-ii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'emerald', 'II', 46.9),
    ('pricing-step-elo-emerald-i', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'emerald', 'I', 46.9),
    ('pricing-step-elo-diamond-iv', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'diamond', 'IV', 70),
    ('pricing-step-elo-diamond-iii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'diamond', 'III', 70),
    ('pricing-step-elo-diamond-ii', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'diamond', 'II', 70),
    ('pricing-step-elo-diamond-i', 'pricing-version-bootstrap-static', 'ELO_BOOST', 'diamond', 'I', 97.3),
    ('pricing-step-duo-iron-iv', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'iron', 'IV', 15.54),
    ('pricing-step-duo-iron-iii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'iron', 'III', 15.54),
    ('pricing-step-duo-iron-ii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'iron', 'II', 15.54),
    ('pricing-step-duo-iron-i', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'iron', 'I', 15.54),
    ('pricing-step-duo-bronze-iv', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'bronze', 'IV', 17.64),
    ('pricing-step-duo-bronze-iii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'bronze', 'III', 17.64),
    ('pricing-step-duo-bronze-ii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'bronze', 'II', 17.64),
    ('pricing-step-duo-bronze-i', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'bronze', 'I', 17.64),
    ('pricing-step-duo-silver-iv', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'silver', 'IV', 20.44),
    ('pricing-step-duo-silver-iii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'silver', 'III', 20.44),
    ('pricing-step-duo-silver-ii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'silver', 'II', 20.44),
    ('pricing-step-duo-silver-i', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'silver', 'I', 20.44),
    ('pricing-step-duo-gold-iv', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'gold', 'IV', 24.64),
    ('pricing-step-duo-gold-iii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'gold', 'III', 24.64),
    ('pricing-step-duo-gold-ii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'gold', 'II', 24.64),
    ('pricing-step-duo-gold-i', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'gold', 'I', 24.64),
    ('pricing-step-duo-platinum-iv', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'platinum', 'IV', 36.54),
    ('pricing-step-duo-platinum-iii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'platinum', 'III', 36.54),
    ('pricing-step-duo-platinum-ii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'platinum', 'II', 36.54),
    ('pricing-step-duo-platinum-i', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'platinum', 'I', 36.54),
    ('pricing-step-duo-emerald-iv', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'emerald', 'IV', 73.08),
    ('pricing-step-duo-emerald-iii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'emerald', 'III', 73.08),
    ('pricing-step-duo-emerald-ii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'emerald', 'II', 73.08),
    ('pricing-step-duo-emerald-i', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'emerald', 'I', 73.08),
    ('pricing-step-duo-diamond-iv', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'diamond', 'IV', 103.04),
    ('pricing-step-duo-diamond-iii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'diamond', 'III', 103.04),
    ('pricing-step-duo-diamond-ii', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'diamond', 'II', 103.04),
    ('pricing-step-duo-diamond-i', 'pricing-version-bootstrap-static', 'DUO_BOOST', 'diamond', 'I', 277.34);

INSERT INTO "pricing_extras" ("id", "pricingVersionId", "type", "modifierRate")
VALUES
    ('pricing-extra-mmr-nerfed', 'pricing-version-bootstrap-static', 'mmr_nerfed', 0.25),
    ('pricing-extra-mmr-buffed', 'pricing-version-bootstrap-static', 'mmr_buffed', 0.35),
    ('pricing-extra-priority-service', 'pricing-version-bootstrap-static', 'priority_service', 0.1),
    ('pricing-extra-favorite-booster', 'pricing-version-bootstrap-static', 'favorite_booster', 0.1),
    ('pricing-extra-super-restriction', 'pricing-version-bootstrap-static', 'super_restriction', 0.35),
    ('pricing-extra-extra-win', 'pricing-version-bootstrap-static', 'extra_win', 0.2),
    ('pricing-extra-restricted-schedule', 'pricing-version-bootstrap-static', 'restricted_schedule', 0.1),
    ('pricing-extra-kd-reduction', 'pricing-version-bootstrap-static', 'kd_reduction', 0.3),
    ('pricing-extra-deadline-reduction', 'pricing-version-bootstrap-static', 'deadline_reduction', 0.2),
    ('pricing-extra-solo-service', 'pricing-version-bootstrap-static', 'solo_service', 0.3),
    ('pricing-extra-offline-chat', 'pricing-version-bootstrap-static', 'offline_chat', 0),
    ('pricing-extra-spell-position', 'pricing-version-bootstrap-static', 'spell_position', 0),
    ('pricing-extra-specific-lanes', 'pricing-version-bootstrap-static', 'specific_lanes', 0),
    ('pricing-extra-specific-champions', 'pricing-version-bootstrap-static', 'specific_champions', 0),
    ('pricing-extra-online-stream', 'pricing-version-bootstrap-static', 'online_stream', 0);

-- AlterTable
ALTER TABLE "order_quotes" ADD COLUMN     "pricingVersionId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pricingVersionId" TEXT;

-- Backfill legacy rows before adding constraints
UPDATE "order_quotes"
SET "pricingVersionId" = 'pricing-version-bootstrap-static'
WHERE "pricingVersionId" IS NULL;

UPDATE "orders"
SET "pricingVersionId" = 'pricing-version-bootstrap-static'
WHERE "pricingVersionId" IS NULL;

-- AlterTable
ALTER TABLE "order_quotes" ALTER COLUMN "pricingVersionId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pricing_steps_pricingVersionId_serviceType_league_division_key" ON "pricing_steps"("pricingVersionId", "serviceType", "league", "division");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_extras_pricingVersionId_type_key" ON "pricing_extras"("pricingVersionId", "type");

-- CreateIndex
CREATE INDEX "order_quotes_pricingVersionId_idx" ON "order_quotes"("pricingVersionId");

-- CreateIndex
CREATE INDEX "orders_pricingVersionId_idx" ON "orders"("pricingVersionId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pricingVersionId_fkey" FOREIGN KEY ("pricingVersionId") REFERENCES "pricing_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_quotes" ADD CONSTRAINT "order_quotes_pricingVersionId_fkey" FOREIGN KEY ("pricingVersionId") REFERENCES "pricing_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_steps" ADD CONSTRAINT "pricing_steps_pricingVersionId_fkey" FOREIGN KEY ("pricingVersionId") REFERENCES "pricing_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_extras" ADD CONSTRAINT "pricing_extras_pricingVersionId_fkey" FOREIGN KEY ("pricingVersionId") REFERENCES "pricing_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
