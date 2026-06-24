-- DropIndex
DROP INDEX "ratings_orderId_key";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ratings_toUserId_idx" ON "ratings"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_orderId_fromUserId_key" ON "ratings"("orderId", "fromUserId");
