/*
  Warnings:

  - A unique constraint covering the columns `[emailConfirmationTokenHash]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailConfirmationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailConfirmationTokenHash" TEXT,
ALTER COLUMN "isActive" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_emailConfirmationTokenHash_key" ON "users"("emailConfirmationTokenHash");
