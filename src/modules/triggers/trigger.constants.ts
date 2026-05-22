export const TRIGGER_NAME_MAX_LENGTH = 100;
export const TRIGGER_EVENT_TYPE_MAX_LENGTH = 100;
export const MAX_COOLDOWN_DAYS = 365;

export const CONDITION_OPERATORS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "not_contains",
  "exists",
  "not_sent_within_days",
] as const;

export const GROUP_OPERATORS = ["AND", "OR"] as const;
