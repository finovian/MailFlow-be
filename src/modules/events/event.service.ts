import { prisma } from "../../lib/prisma.js";
import { inngest } from "../../inngest/client.js";
import { ConflictError, NotFoundError } from "../../utils/errors.js";
import {
  buildPaginationArgs,
  buildPaginatedResponse,
} from "../../services/pagination.service.js";
import { createModuleLogger } from "../../lib/logger.js";
import type { CreateEventInput, EventListQuery } from "./event.types.js";
import type { Prisma } from "@prisma/client";

const log = createModuleLogger("event-service");

export async function create(userId: string, data: CreateEventInput) {

  // const existing = await prisma.event.findUnique({
  //   where: {
  //     userId_idempotencyKey: {
  //       userId,
  //       idempotencyKey: data.idempotencyKey,
  //     },
  //   },
  //   select: { id: true },
  // });

  // if (existing) {
  //   throw new ConflictError("Event with this idempotency key already exists");
  // }


  const event = await prisma.event.create({
    data: {
      userId,
      eventType: data.eventType,
      payload: data.payload as Prisma.InputJsonValue,
      idempotencyKey: data.idempotencyKey,
      processingStatus: "PENDING",
    },
  });

  // Invoke Inngest workflow
  let queued = false;
  try {
    await inngest.send({
      name: "app/event.received",
      data: { eventId: event.id },
    });
    queued = true;
  } catch (err) {
    log.error({ err, eventId: event.id }, "Failed to send event to Inngest (Background processing will not start)");
  }

  log.info(
    {
      eventId: event.id,
      eventType: data.eventType,
      idempotencyKey: data.idempotencyKey,
      queued
    },
    queued ? "Event created and queued for processing" : "Event created but NOT queued (Inngest offline)"
  );

  return event;
}

export async function getById(userId: string, id: string) {
  const event = await prisma.event.findFirst({
    where: { id, userId },
    include: {
      _count: {
        select: { emailJobs: true },
      },
    },
  });

  if (!event) {
    throw new NotFoundError("Event", id);
  }

  return event;
}

export async function list(userId: string, query: EventListQuery) {
  const { page = 1, limit = 20, eventType, processingStatus } = query;

  const where: Prisma.EventWhereInput = { userId };

  if (eventType) {
    where.eventType = eventType;
  }

  if (processingStatus) {
    where.processingStatus = processingStatus;
  }

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        eventType: true,
        idempotencyKey: true,
        processingStatus: true,
        processingError: true,
        processedAt: true,
        createdAt: true,
        _count: {
          select: { emailJobs: true },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, limit);
}
