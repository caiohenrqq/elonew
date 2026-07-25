-- CreateEnum
CREATE TYPE "WalletTransactionReleaseSource" AS ENUM ('SCHEDULE', 'ADMIN');

-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "releasedBy" "WalletTransactionReleaseSource";
