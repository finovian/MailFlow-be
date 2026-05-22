/*
  Warnings:

  - You are about to drop the column `createdBy` on the `templates` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,idempotencyKey]` on the table `events` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,slug]` on the table `templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `email_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `send_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `triggers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "events_idempotencyKey_key";

-- DropIndex
DROP INDEX "templates_slug_idx";

-- DropIndex
DROP INDEX "templates_slug_key";

-- AlterTable
ALTER TABLE "email_jobs" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "send_logs" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "createdBy",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "triggers" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "email_jobs_userId_idx" ON "email_jobs"("userId");

-- CreateIndex
CREATE INDEX "events_userId_idx" ON "events"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "events_userId_idempotencyKey_key" ON "events"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "send_logs_userId_idx" ON "send_logs"("userId");

-- CreateIndex
CREATE INDEX "templates_userId_idx" ON "templates"("userId");

-- CreateIndex
CREATE INDEX "templates_createdAt_idx" ON "templates"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "templates_userId_slug_key" ON "templates"("userId", "slug");

-- CreateIndex
CREATE INDEX "triggers_userId_idx" ON "triggers"("userId");
