/*
  Warnings:

  - Added the required column `paymentMethod` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'pix', 'boleto');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL;
