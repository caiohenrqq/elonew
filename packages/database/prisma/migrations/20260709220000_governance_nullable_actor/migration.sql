-- DropForeignKey
ALTER TABLE "admin_governance_actions" DROP CONSTRAINT "admin_governance_actions_adminUserId_fkey";

-- AlterTable
ALTER TABLE "admin_governance_actions" ALTER COLUMN "adminUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "admin_governance_actions" ADD CONSTRAINT "admin_governance_actions_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
