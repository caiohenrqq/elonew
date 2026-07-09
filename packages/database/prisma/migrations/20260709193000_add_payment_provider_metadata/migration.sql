ALTER TABLE "payments"
ADD COLUMN "gatewayPaymentMethodId" TEXT,
ADD COLUMN "gatewayPaymentTypeId" TEXT;

CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");
