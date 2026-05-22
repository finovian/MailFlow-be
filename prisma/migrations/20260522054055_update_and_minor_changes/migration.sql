/*
  Warnings:

  - You are about to drop the column `processed` on the `events` table. All the data in the column will be lost.
  - The `variables` column on the `templates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `active` on the `triggers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TriggerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EventProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- DropIndex
DROP INDEX "events_processed_idx";

-- DropIndex
DROP INDEX "triggers_active_idx";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "processed",
ADD COLUMN     "processingStatus" "EventProcessingStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "variables",
ADD COLUMN     "variables" TEXT[];

-- AlterTable
ALTER TABLE "triggers" DROP COLUMN "active",
ADD COLUMN     "status" "TriggerStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "events_processingStatus_idx" ON "events"("processingStatus");

-- CreateIndex
CREATE INDEX "triggers_status_idx" ON "triggers"("status");

-- CreateIndex
CREATE INDEX "triggers_createdAt_idx" ON "triggers"("createdAt");
