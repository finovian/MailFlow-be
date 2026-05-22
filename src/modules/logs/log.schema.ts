import { z } from "zod";

export const logIdParamSchema = z.object({
  id: z.string().min(1, "Log ID is required"),
});

export const logListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20),
  status: z.enum(["SUCCESS", "FAILED"]).optional(),
  recipientEmail: z.string().optional(),
  emailJobId: z.string().optional(),
});
