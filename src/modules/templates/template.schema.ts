import { z } from "zod";
import {
  TEMPLATE_NAME_MAX_LENGTH,
  TEMPLATE_SUBJECT_MAX_LENGTH,
  TEMPLATE_DESCRIPTION_MAX_LENGTH,
} from "./template.constants.js";

const templateStatusSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.toUpperCase() : val),
  z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
);

const baseTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(TEMPLATE_NAME_MAX_LENGTH),

  subject: z
    .string()
    .min(1, "Subject is required")
    .max(TEMPLATE_SUBJECT_MAX_LENGTH),

  bodyHtml: z.string().min(1, "Body HTML is required"),

  description: z
    .string()
    .max(TEMPLATE_DESCRIPTION_MAX_LENGTH)
    .optional(),

  status: templateStatusSchema,
});

export const createTemplateSchema = baseTemplateSchema.extend({
  status: templateStatusSchema.default("ACTIVE"),
});

export const updateTemplateSchema = baseTemplateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
export const testSendSchema = z.object({
  recipientEmail: z.string().email("Invalid recipient email"),
  mockPayload: z.record(z.string(), z.unknown()).default({}),
});

export const templateIdParamSchema = z.object({
  id: z.string().min(1, "Template ID is required"),
});

export const templateListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});
