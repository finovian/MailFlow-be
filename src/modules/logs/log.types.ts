import type { z } from "zod";
import type { logIdParamSchema, logListQuerySchema } from "./log.schema.js";

export type LogIdParam = z.infer<typeof logIdParamSchema>;
export type LogListQuery = z.infer<typeof logListQuerySchema>;
