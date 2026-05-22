import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import {
  buildPaginationArgs,
  buildPaginatedResponse,
} from "../../services/pagination.service.js";
import { createModuleLogger } from "../../lib/logger.js";
import type { CreateTriggerInput, UpdateTriggerInput, TriggerListQuery } from "./trigger.types.js";
import type { Prisma } from "@prisma/client";

const log = createModuleLogger("trigger-service");

export async function create(userId: string, data: CreateTriggerInput) {
  // Verify template ownership
  const template = await prisma.template.findFirst({
    where: { id: data.templateId, userId },
    select: { id: true },
  });

  if (!template) {
    throw new NotFoundError("Template", data.templateId);
  }

  const trigger = await prisma.trigger.create({
    data: {
      userId,
      name: data.name,
      eventType: data.eventType,
      templateId: data.templateId,
      conditions: data.conditions as Prisma.InputJsonValue,
      recipientField: data.recipientField,
      sendOnce: data.sendOnce,
      cooldownDays: data.cooldownDays ?? null,
    },
    include: {
      template: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  log.info({ triggerId: trigger.id, eventType: data.eventType }, "Trigger created");
  return trigger;
}

export async function list(userId: string, query: TriggerListQuery) {
  const { page = 1, limit = 20, search, status, eventType } = query;

  const where: Prisma.TriggerWhereInput = { userId };

  if (status) {
    where.status = status;
  }

  if (eventType) {
    where.eventType = eventType;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.trigger.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      orderBy: { createdAt: "desc" },
      include: {
        template: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.trigger.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, limit);
}

export async function getById(userId: string, id: string) {
  const trigger = await prisma.trigger.findFirst({
    where: { id, userId },
    include: {
      template: {
        select: { id: true, name: true, slug: true, subject: true },
      },
    },
  });

  if (!trigger) {
    throw new NotFoundError("Trigger", id);
  }

  return trigger;
}

export async function update(userId: string, id: string, data: UpdateTriggerInput) {
  const existing = await prisma.trigger.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Trigger", id);
  }

  // If templateId is changing, verify ownership of new template
  if (data.templateId) {
    const template = await prisma.template.findFirst({
      where: { id: data.templateId, userId },
      select: { id: true },
    });

    if (!template) {
      throw new NotFoundError("Template", data.templateId);
    }
  }

  const trigger = await prisma.trigger.update({
    where: { id },
    data: {
      ...data,
      conditions: data.conditions as Prisma.InputJsonValue | undefined,
    },
    include: {
      template: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  log.info({ triggerId: id }, "Trigger updated");
  return trigger;
}

export async function deactivate(userId: string, id: string) {
  const existing = await prisma.trigger.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Trigger", id);
  }

  const trigger = await prisma.trigger.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  log.info({ triggerId: id }, "Trigger deactivated");
  return trigger;
}
