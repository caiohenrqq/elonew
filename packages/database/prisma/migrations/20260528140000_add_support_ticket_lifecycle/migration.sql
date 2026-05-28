-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'WAITING_USER', 'WAITING_SUPPORT', 'CLOSED');

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "orderId" TEXT;
ALTER TABLE "tickets" ADD COLUMN "status_new" "TicketStatus" NOT NULL DEFAULT 'WAITING_SUPPORT';

UPDATE "tickets"
SET "status_new" = CASE "status"
    WHEN 'OPEN' THEN 'OPEN'::"TicketStatus"
    WHEN 'WAITING_USER' THEN 'WAITING_USER'::"TicketStatus"
    WHEN 'WAITING_SUPPORT' THEN 'WAITING_SUPPORT'::"TicketStatus"
    WHEN 'PENDING' THEN 'WAITING_SUPPORT'::"TicketStatus"
    WHEN 'CLOSED' THEN 'CLOSED'::"TicketStatus"
    ELSE 'WAITING_SUPPORT'::"TicketStatus"
END;

ALTER TABLE "tickets" DROP COLUMN "status";
ALTER TABLE "tickets" RENAME COLUMN "status_new" TO "status";

-- CreateIndex
CREATE INDEX "tickets_userId_updatedAt_idx" ON "tickets"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "tickets_orderId_idx" ON "tickets"("orderId");

-- CreateIndex
CREATE INDEX "tickets_status_updatedAt_idx" ON "tickets"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
