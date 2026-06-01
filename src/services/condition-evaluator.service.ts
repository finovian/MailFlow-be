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

export interface EvaluationResult {
  passed: boolean;
  failedCondition?: {
    field: string;
    operator: string;
    expected?: unknown;
    actual?: unknown;
  };
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
): Promise<EvaluationResult> {
  const fieldValue = getNestedValue(payload, rule.field);

  let passed = false;

  if (rule.op === "not_sent_within_days") {
    if (!context?.deduplicationChecker) {
      log.warn("not_sent_within_days operator used without deduplication checker — defaulting to true");
      passed = true;
    } else {
      const days = Number(rule.value) || 0;
      passed = await context.deduplicationChecker(context.triggerId, context.recipientEmail, days);
    }
  } else {
    switch (rule.op) {
      case "eq":
        passed = fieldValue === rule.value;
        break;
      case "neq":
        passed = fieldValue !== rule.value;
        break;
      case "gt":
        passed = typeof fieldValue === "number" && typeof rule.value === "number" && fieldValue > rule.value;
        break;
      case "gte":
        passed = typeof fieldValue === "number" && typeof rule.value === "number" && fieldValue >= rule.value;
        break;
      case "lt":
        passed = typeof fieldValue === "number" && typeof rule.value === "number" && fieldValue < rule.value;
        break;
      case "lte":
        passed = typeof fieldValue === "number" && typeof rule.value === "number" && fieldValue <= rule.value;
        break;
      case "contains":
        passed = typeof fieldValue === "string" && typeof rule.value === "string" && fieldValue.includes(rule.value);
        break;
      case "not_contains":
        passed = typeof fieldValue === "string" && typeof rule.value === "string" && !fieldValue.includes(rule.value);
        break;
      case "exists":
        passed = fieldValue !== undefined && fieldValue !== null;
        break;
      default:
        log.warn({ op: rule.op }, "Unknown condition operator — defaulting to false");
        passed = false;
    }
  }

  if (passed) {
    return { passed: true };
  }

  return {
    passed: false,
    failedCondition: {
      field: rule.field,
      operator: rule.op,
      expected: rule.value,
      actual: fieldValue,
    },
  };
}

export async function evaluateConditions(
  conditions: ConditionGroup,
  payload: Record<string, unknown>,
  context?: { triggerId: string; recipientEmail: string; deduplicationChecker?: DeduplicationChecker },
): Promise<EvaluationResult> {
  const { operator, rules } = conditions;

  const results: EvaluationResult[] = [];

  for (const rule of rules) {
    let result: EvaluationResult;

    if (isConditionGroup(rule)) {
      result = await evaluateConditions(rule, payload, context);
    } else {
      result = await evaluateRule(rule, payload, context);
    }

    results.push(result);


    if (operator === "AND" && !result.passed) {
      log.debug({ operator, failedAt: rule }, "AND group short-circuited");
      return result;
    }
    if (operator === "OR" && result.passed) {
      log.debug({ operator, matchedAt: rule }, "OR group short-circuited");
      return { passed: true };
    }
  }

  // AND: all true → true; OR: none true → false
  if (operator === "AND") {
    return { passed: true };
  } else {
    // For OR, if we reached here, all failed. Return the first failure.
    const firstFailed = results.find((r) => !r.passed);
    return firstFailed || { passed: false };
  }
}
