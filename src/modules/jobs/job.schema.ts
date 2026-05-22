import { z } from "zod";

export const jobIdParamSchema = z.object({
  id: z.string().min(1, "Job ID is required"),
});

export const jobListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["PENDING", "PROCESSING", "SENT", "FAILED", "CANCELLED"]).optional(),
  recipientEmail: z.string().email().optional(),
});
