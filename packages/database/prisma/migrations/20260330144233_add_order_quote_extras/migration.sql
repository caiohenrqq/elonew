/*
  Warnings:

  - A unique constraint covering the columns `[orderId,type]` on the table `order_extras` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "order_extras" DROP CONSTRAINT "order_extras_orderId_fkey";

-- CreateTable
CREATE TABLE "order_quote_extras" (
    "id" TEXT NOT NULL,
    "orderQuoteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_quote_extras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_quote_extras_orderQuoteId_type_key" ON "order_quote_extras"("orderQuoteId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "order_extras_orderId_type_key" ON "order_extras"("orderId", "type");

-- AddForeignKey
ALTER TABLE "order_extras" ADD CONSTRAINT "order_extras_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_quote_extras" ADD CONSTRAINT "order_quote_extras_orderQuoteId_fkey" FOREIGN KEY ("orderQuoteId") REFERENCES "order_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
