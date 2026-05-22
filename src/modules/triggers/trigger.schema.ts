import { z } from "zod";
import {
  TRIGGER_NAME_MAX_LENGTH,
  TRIGGER_EVENT_TYPE_MAX_LENGTH,
  MAX_COOLDOWN_DAYS,
  CONDITION_OPERATORS,
  GROUP_OPERATORS,
} from "./trigger.constants.js";

const conditionRuleSchema = z.object({
  field: z.string().min(1),
  op: z.enum(CONDITION_OPERATORS),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.null()])
    .optional(),
});

type ConditionGroupInput = {
  operator: "AND" | "OR";
  rules: Array<ConditionGroupInput | { field: string; op: string; value?: unknown }>;
};

const conditionGroupSchema: z.ZodType<ConditionGroupInput> = z.object({
  operator: z.enum(GROUP_OPERATORS),
  rules: z
    .array(z.union([conditionRuleSchema, z.lazy(() => conditionGroupSchema)]))
    .min(1, "At least one rule is required"),
});

export const createTriggerSchema = z.object({
  name: z.string().min(1, "Name is required").max(TRIGGER_NAME_MAX_LENGTH),
  eventType: z.string().min(1, "Event type is required").max(TRIGGER_EVENT_TYPE_MAX_LENGTH),
  templateId: z.string().min(1, "Template ID is required"),
  conditions: conditionGroupSchema,
  recipientField: z.string().min(1, "Recipient field path is required"),
  sendOnce: z.boolean().default(false),
  cooldownDays: z
    .number()
    .int()
    .nonnegative()
    .max(MAX_COOLDOWN_DAYS)
    .optional(),
});

export const updateTriggerSchema = createTriggerSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const triggerIdParamSchema = z.object({
  id: z.string().min(1, "Trigger ID is required"),
});

export const triggerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  eventType: z.string().optional(),
});

export { conditionGroupSchema, conditionRuleSchema };
