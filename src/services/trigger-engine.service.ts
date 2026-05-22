import { prisma } from "../lib/prisma.js";
import { evaluateConditions, type ConditionGroup } from "./condition-evaluator.service.js";
import { createModuleLogger } from "../lib/logger.js";
import type { Trigger, Template } from "@prisma/client";

const log = createModuleLogger("trigger-engine");

export type TriggerWithTemplate = Trigger & { template: Template };

export async function findMatchingTriggers(
  userId: string,
  eventType: string,
): Promise<TriggerWithTemplate[]> {
  const triggers = await prisma.trigger.findMany({
    where: {
      userId,
      eventType,
      status: "ACTIVE",
    },
    include: {
      template: true,
    },
  });

  log.debug(
    { userId, eventType, count: triggers.length },
    "Found matching triggers",
  );

  return triggers;
}

export async function checkDeduplication(
  triggerId: string,
  recipientEmail: string,
  days: number,
): Promise<boolean> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const existingSend = await prisma.sendLog.findFirst({
    where: {
      recipientEmail,
      status: "SUCCESS",
      sentAt: { gte: cutoff },
      emailJob: {
        triggerId,
      },
    },
    select: { id: true },
  });

  const isSafeToSend = existingSend === null;

  log.debug(
    { triggerId, recipientEmail, days, isSafeToSend },
    "Deduplication check completed",
  );

  return isSafeToSend;
}

export async function checkSendOnce(
  triggerId: string,
  recipientEmail: string,
): Promise<boolean> {
  const existingSend = await prisma.sendLog.findFirst({
    where: {
      recipientEmail,
      status: "SUCCESS",
      emailJob: {
        triggerId,
      },
    },
    select: { id: true },
  });

  const isSafeToSend = existingSend === null;

  log.debug(
    { triggerId, recipientEmail, isSafeToSend },
    "SendOnce check completed",
  );

  return isSafeToSend;
}

export async function evaluateTrigger(
  trigger: TriggerWithTemplate,
  payload: Record<string, unknown>,
  recipientEmail: string,
): Promise<boolean> {
  // 1. Check sendOnce dedup
  if (trigger.sendOnce) {
    const safeToSend = await checkSendOnce(trigger.id, recipientEmail);
    if (!safeToSend) {
      log.info(
        { triggerId: trigger.id, recipientEmail },
        "Trigger skipped — sendOnce already fulfilled",
      );
      return false;
    }
  }

  // 2. Check cooldownDays
  if (trigger.cooldownDays) {
    const safeToSend = await checkDeduplication(trigger.id, recipientEmail, trigger.cooldownDays);
    if (!safeToSend) {
      log.info(
        { triggerId: trigger.id, recipientEmail, cooldownDays: trigger.cooldownDays },
        "Trigger skipped — within cooldown period",
      );
      return false;
    }
  }

  // 3. Evaluate conditions
  const conditions = trigger.conditions as unknown as ConditionGroup;
  const conditionsPass = await evaluateConditions(conditions, payload, {
    triggerId: trigger.id,
    recipientEmail,
    deduplicationChecker: checkDeduplication,
  });

  if (!conditionsPass) {
    log.info(
      { triggerId: trigger.id, recipientEmail },
      "Trigger skipped — conditions not met",
    );
    return false;
  }

  log.info(
    { triggerId: trigger.id, recipientEmail },
    "Trigger matched — all checks passed",
  );
  return true;
}
