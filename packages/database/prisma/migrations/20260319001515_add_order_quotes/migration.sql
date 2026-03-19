-- CreateTable
CREATE TABLE "order_quotes" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "currentLeague" TEXT NOT NULL,
    "currentDivision" TEXT NOT NULL,
    "currentLp" INTEGER NOT NULL,
    "desiredLeague" TEXT NOT NULL,
    "desiredDivision" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "desiredQueue" TEXT NOT NULL,
    "lpGain" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_quotes_orderId_key" ON "order_quotes"("orderId");

-- CreateIndex
CREATE INDEX "order_quotes_clientId_expiresAt_idx" ON "order_quotes"("clientId", "expiresAt");

-- CreateIndex
CREATE INDEX "order_quotes_clientId_consumedAt_idx" ON "order_quotes"("clientId", "consumedAt");

-- AddForeignKey
ALTER TABLE "order_quotes" ADD CONSTRAINT "order_quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_quotes" ADD CONSTRAINT "order_quotes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
