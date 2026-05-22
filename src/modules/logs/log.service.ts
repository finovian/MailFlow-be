import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import {
  buildPaginationArgs,
  buildPaginatedResponse,
} from "../../services/pagination.service.js";
import { createModuleLogger } from "../../lib/logger.js";
import type { LogListQuery } from "./log.types.js";
import type { Prisma } from "@prisma/client";

const log = createModuleLogger("log-service");

export async function list(userId: string, query: LogListQuery) {
  const { page = 1, limit = 20, status, recipientEmail, emailJobId } = query;

  const where: Prisma.SendLogWhereInput = { userId };

  if (status) {
    where.status = status;
  }

  if (recipientEmail) {
    where.recipientEmail = recipientEmail;
  }

  if (emailJobId) {
    where.emailJobId = emailJobId;
  }

  const [items, total] = await Promise.all([
    prisma.sendLog.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        emailJobId: true,
        recipientEmail: true,
        subject: true,
        provider: true,
        providerMessageId: true,
        status: true,
        errorMessage: true,
        sentAt: true,
      },
    }),
    prisma.sendLog.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, limit);
}

export async function getById(userId: string, id: string) {
  const sendLog = await prisma.sendLog.findFirst({
    where: { id, userId },
  });

  if (!sendLog) {
    throw new NotFoundError("SendLog", id);
  }

  return sendLog;
}
