-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "activityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropIndex
DROP INDEX "notifications_recipientId_createdAt_id_idx";

-- CreateIndex
CREATE INDEX "notifications_recipientId_activityAt_id_idx" ON "notifications"("recipientId", "activityAt", "id");
