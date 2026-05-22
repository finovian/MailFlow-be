import { getNestedValue } from "./placeholder.service.js";
import { createModuleLogger } from "../lib/logger.js";

const log = createModuleLogger("condition-evaluator");

export interface ConditionRule {
  field: string;
  op: string;
  value?: unknown;
}

export interface ConditionGroup {
  operator: "AND" | "OR";
  rules: Array<ConditionRule | ConditionGroup>;
}

export type DeduplicationChecker = (
  triggerId: string,
  recipientEmail: string,
  days: number,
) => Promise<boolean>;

function isConditionGroup(rule: ConditionRule | ConditionGroup): rule is ConditionGroup {
  return "operator" in rule && "rules" in rule;
}

async function evaluateRule(
  rule: ConditionRule,
  payload: Record<string, unknown>,
  context?: { triggerId: string; recipientEmail: string; deduplicationChecker?: DeduplicationChecker },
): Promise<boolean> {
  if (rule.op === "not_sent_within_days") {
    if (!context?.deduplicationChecker) {
      log.warn("not_sent_within_days operator used without deduplication checker — defaulting to true");
      return true;
    }
    const days = Number(rule.value) || 0;
    return context.deduplicationChecker(context.triggerId, context.recipientEmail, days);
  }

  const fieldValue = getNestedValue(payload, rule.field);

  switch (rule.op) {
    case "eq":
      return fieldValue === rule.value;

    case "neq":
      return fieldValue !== rule.value;

    case "gt":
      return typeof fieldValue === "number" && typeof rule.value === "number" && fieldValue > rule.value;

    case "gte":
      return typeof fieldValue === "number" && typeof rule.value === "number" && fieldValue >= rule.value;

    case "lt":
      return typeof fieldValue === "number" && typeof rule.value === "number" && fieldValue < rule.value;

    case "lte":
      return typeof fieldValue === "number" && typeof rule.value === "number" && fieldValue <= rule.value;

    case "contains":
      return typeof fieldValue === "string" && typeof rule.value === "string" && fieldValue.includes(rule.value);

    case "not_contains":
      return typeof fieldValue === "string" && typeof rule.value === "string" && !fieldValue.includes(rule.value);

    case "exists":
      return fieldValue !== undefined && fieldValue !== null;

    default:
      log.warn({ op: rule.op }, "Unknown condition operator — defaulting to false");
      return false;
  }
}

export async function evaluateConditions(
  conditions: ConditionGroup,
  payload: Record<string, unknown>,
  context?: { triggerId: string; recipientEmail: string; deduplicationChecker?: DeduplicationChecker },
): Promise<boolean> {
  const { operator, rules } = conditions;

  const results: boolean[] = [];

  for (const rule of rules) {
    let result: boolean;

    if (isConditionGroup(rule)) {
      result = await evaluateConditions(rule, payload, context);
    } else {
      result = await evaluateRule(rule, payload, context);
    }

    results.push(result);

    // Short-circuit: AND fails fast on false, OR succeeds fast on true
    if (operator === "AND" && !result) {
      log.debug({ operator, failedAt: rule }, "AND group short-circuited");
      return false;
    }
    if (operator === "OR" && result) {
      log.debug({ operator, matchedAt: rule }, "OR group short-circuited");
      return true;
    }
  }

  // AND: all true → true; OR: none true → false
  return operator === "AND" ? results.every(Boolean) : results.some(Boolean);
}
