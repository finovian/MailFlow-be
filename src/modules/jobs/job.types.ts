import type { z } from "zod";
import type { jobIdParamSchema, jobListQuerySchema } from "./job.schema.js";

export type JobIdParam = z.infer<typeof jobIdParamSchema>;
export type JobListQuery = z.infer<typeof jobListQuerySchema>;
