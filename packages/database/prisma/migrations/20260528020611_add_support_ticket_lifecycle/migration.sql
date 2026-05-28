/*
  Warnings:

  - A unique constraint covering the columns `[status]` on the table `pricing_versions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "pricing_versions_single_active_key";

-- CreateIndex
CREATE UNIQUE INDEX "pricing_versions_single_active_key" ON "pricing_versions"("status") WHERE ("status" = 'ACTIVE');
