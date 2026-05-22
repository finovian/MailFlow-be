import type { z } from "zod";
import type {
  createEventSchema,
  eventIdParamSchema,
  eventListQuerySchema,
} from "./event.schema.js";

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type EventIdParam = z.infer<typeof eventIdParamSchema>;
export type EventListQuery = z.infer<typeof eventListQuerySchema>;
