import { z } from "zod";
import {
  EVENT_TYPE_MAX_LENGTH,
  IDEMPOTENCY_KEY_MAX_LENGTH,
} from "./event.constants.js";

export const createEventSchema = z.object({
  eventType: z.string().min(1, "Event type is required").max(EVENT_TYPE_MAX_LENGTH),
  payload: z
    .record(z.string(), z.unknown())
    .refine((val) => Object.keys(val).length > 0, {
      message: "Payload must be a non-empty object",
    }),
  idempotencyKey: z
    .string()
    .min(1, "Idempotency key is required")
    .max(IDEMPOTENCY_KEY_MAX_LENGTH),
});

export const eventIdParamSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
});

export const eventListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  eventType: z.string().optional(),
  processingStatus: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
});
