import { prisma } from "../../lib/prisma.js";
import { inngest } from "../../inngest/client.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import {
  buildPaginationArgs,
  buildPaginatedResponse,
} from "../../services/pagination.service.js";
import { createModuleLogger } from "../../lib/logger.js";
import { MAX_RETRY_COUNT } from "./job.constants.js";
import type { JobListQuery } from "./job.types.js";
import type { Prisma } from "@prisma/client";

const log = createModuleLogger("job-service");

export async function list(userId: string, query: JobListQuery) {
  const { page = 1, limit = 20, status, recipientEmail } = query;

  const where: Prisma.EmailJobWhereInput = { userId };

  if (status) {
    where.status = status;
  }

  if (recipientEmail) {
    where.recipientEmail = recipientEmail;
  }

  const [items, total] = await Promise.all([
    prisma.emailJob.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        recipientEmail: true,
        renderedSubject: true,
        status: true,
        retryCount: true,
        lastError: true,
        providerMessageId: true,
        processedAt: true,
        createdAt: true,
        trigger: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
        event: { select: { id: true, eventType: true } },
      },
    }),
    prisma.emailJob.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, limit);
}

export async function getById(userId: string, id: string) {
  const job = await prisma.emailJob.findFirst({
    where: { id, userId },
    include: {
      trigger: { select: { id: true, name: true, eventType: true } },
      template: { select: { id: true, name: true, slug: true } },
      event: { select: { id: true, eventType: true, createdAt: true } },
      sendLogs: {
        orderBy: { sentAt: "desc" },
        select: {
          id: true,
          status: true,
          providerMessageId: true,
          errorMessage: true,
          sentAt: true,
        },
      },
    },
  });

  if (!job) {
    throw new NotFoundError("EmailJob", id);
  }

  return job;
}

export async function retry(userId: string, id: string) {
  const job = await prisma.emailJob.findFirst({
    where: { id, userId },
    select: { id: true, status: true, retryCount: true },
  });

  if (!job) {
    throw new NotFoundError("EmailJob", id);
  }

  if (job.status !== "FAILED") {
    throw new ValidationError("Only failed jobs can be retried", [
      { field: "status", message: `Current status is '${job.status}', expected 'FAILED'` },
    ]);
  }

  if (job.retryCount >= MAX_RETRY_COUNT) {
    throw new ValidationError(`Maximum retry count (${MAX_RETRY_COUNT}) exceeded`, [
      { field: "retryCount", message: `Job has already been retried ${job.retryCount} times` },
    ]);
  }

  const updatedJob = await prisma.emailJob.update({
    where: { id },
    data: {
      status: "PENDING",
      retryCount: { increment: 1 },
      lastError: null,
      nextRetryAt: null,
    },
  });

  // Trigger Inngest retry workflow
  await inngest.send({
    name: "app/job.retry",
    data: { jobId: updatedJob.id },
  });

  log.info(
    { jobId: id, retryCount: updatedJob.retryCount },
    "Job queued for retry",
  );

  return updatedJob;
}
