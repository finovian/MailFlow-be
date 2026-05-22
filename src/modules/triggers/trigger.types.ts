import type { z } from "zod";
import type {
  createTriggerSchema,
  updateTriggerSchema,
  triggerIdParamSchema,
  triggerListQuerySchema,
  conditionRuleSchema,
  conditionGroupSchema,
} from "./trigger.schema.js";

export type CreateTriggerInput = z.infer<typeof createTriggerSchema>;
export type UpdateTriggerInput = z.infer<typeof updateTriggerSchema>;
export type TriggerIdParam = z.infer<typeof triggerIdParamSchema>;
export type TriggerListQuery = z.infer<typeof triggerListQuerySchema>;
export type ConditionRule = z.infer<typeof conditionRuleSchema>;
export type ConditionGroup = z.infer<typeof conditionGroupSchema>;
