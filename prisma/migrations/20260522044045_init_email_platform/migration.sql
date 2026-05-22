/*
  Warnings:

  - You are about to drop the `Template` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SendStatus" AS ENUM ('SUCCESS', 'FAILED');

-- DropTable
DROP TABLE "Template";

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triggers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "sendOnce" BOOLEAN NOT NULL DEFAULT false,
    "cooldownDays" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_jobs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "renderedSubject" TEXT,
    "renderedHtml" TEXT,
    "status" "EmailJobStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "providerMessageId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "send_logs" (
    "id" TEXT NOT NULL,
    "emailJobId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" "SendStatus" NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "send_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "templates_slug_key" ON "templates"("slug");

-- CreateIndex
CREATE INDEX "templates_status_idx" ON "templates"("status");

-- CreateIndex
CREATE INDEX "templates_slug_idx" ON "templates"("slug");

-- CreateIndex
CREATE INDEX "triggers_eventType_idx" ON "triggers"("eventType");

-- CreateIndex
CREATE INDEX "triggers_active_idx" ON "triggers"("active");

-- CreateIndex
CREATE INDEX "triggers_templateId_idx" ON "triggers"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "events_idempotencyKey_key" ON "events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "events_eventType_idx" ON "events"("eventType");

-- CreateIndex
CREATE INDEX "events_processed_idx" ON "events"("processed");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- CreateIndex
CREATE INDEX "email_jobs_status_idx" ON "email_jobs"("status");

-- CreateIndex
CREATE INDEX "email_jobs_nextRetryAt_idx" ON "email_jobs"("nextRetryAt");

-- CreateIndex
CREATE INDEX "email_jobs_recipientEmail_idx" ON "email_jobs"("recipientEmail");

-- CreateIndex
CREATE INDEX "email_jobs_eventId_idx" ON "email_jobs"("eventId");

-- CreateIndex
CREATE INDEX "email_jobs_triggerId_idx" ON "email_jobs"("triggerId");

-- CreateIndex
CREATE INDEX "email_jobs_templateId_idx" ON "email_jobs"("templateId");

-- CreateIndex
CREATE INDEX "email_jobs_createdAt_idx" ON "email_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "send_logs_emailJobId_idx" ON "send_logs"("emailJobId");

-- CreateIndex
CREATE INDEX "send_logs_recipientEmail_idx" ON "send_logs"("recipientEmail");

-- CreateIndex
CREATE INDEX "send_logs_status_idx" ON "send_logs"("status");

-- CreateIndex
CREATE INDEX "send_logs_sentAt_idx" ON "send_logs"("sentAt");

-- AddForeignKey
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_jobs" ADD CONSTRAINT "email_jobs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_jobs" ADD CONSTRAINT "email_jobs_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "triggers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_jobs" ADD CONSTRAINT "email_jobs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "send_logs" ADD CONSTRAINT "send_logs_emailJobId_fkey" FOREIGN KEY ("emailJobId") REFERENCES "email_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
