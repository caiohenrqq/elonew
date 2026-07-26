-- CreateTable
CREATE TABLE "order_credential_reveals" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "boosterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_credential_reveals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_credential_reveals_orderId_createdAt_idx" ON "order_credential_reveals"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "order_credential_reveals_boosterId_createdAt_idx" ON "order_credential_reveals"("boosterId", "createdAt");

-- AddForeignKey
ALTER TABLE "order_credential_reveals" ADD CONSTRAINT "order_credential_reveals_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_credential_reveals" ADD CONSTRAINT "order_credential_reveals_boosterId_fkey" FOREIGN KEY ("boosterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
