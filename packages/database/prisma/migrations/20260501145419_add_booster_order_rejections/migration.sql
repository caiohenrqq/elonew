-- CreateTable
CREATE TABLE "order_booster_rejections" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "boosterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_booster_rejections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_booster_rejections_boosterId_idx" ON "order_booster_rejections"("boosterId");

-- CreateIndex
CREATE UNIQUE INDEX "order_booster_rejections_orderId_boosterId_key" ON "order_booster_rejections"("orderId", "boosterId");

-- AddForeignKey
ALTER TABLE "order_booster_rejections" ADD CONSTRAINT "order_booster_rejections_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_booster_rejections" ADD CONSTRAINT "order_booster_rejections_boosterId_fkey" FOREIGN KEY ("boosterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
