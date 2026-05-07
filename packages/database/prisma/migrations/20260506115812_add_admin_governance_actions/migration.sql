-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "admin_governance_actions" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_governance_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_governance_actions_adminUserId_createdAt_idx" ON "admin_governance_actions"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_governance_actions_targetUserId_createdAt_idx" ON "admin_governance_actions"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_governance_actions_targetOrderId_createdAt_idx" ON "admin_governance_actions"("targetOrderId", "createdAt");

-- AddForeignKey
ALTER TABLE "admin_governance_actions" ADD CONSTRAINT "admin_governance_actions_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_governance_actions" ADD CONSTRAINT "admin_governance_actions_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_governance_actions" ADD CONSTRAINT "admin_governance_actions_targetOrderId_fkey" FOREIGN KEY ("targetOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
