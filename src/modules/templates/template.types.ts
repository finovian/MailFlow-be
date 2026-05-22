import type { z } from "zod";
import type {
  createTemplateSchema,
  updateTemplateSchema,
  testSendSchema,
  templateIdParamSchema,
  templateListQuerySchema,
} from "./template.schema.js";

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TestSendInput = z.infer<typeof testSendSchema>;
export type TemplateIdParam = z.infer<typeof templateIdParamSchema>;
export type TemplateListQuery = z.infer<typeof templateListQuerySchema>;
