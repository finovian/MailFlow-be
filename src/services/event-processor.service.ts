import { prisma } from "../lib/prisma.js";
import { findMatchingTriggers, evaluateTrigger } from "./trigger-engine.service.js";
import { renderEmail } from "./email-render.service.js";
import { sendEmail } from "./resend.service.js";
import { getNestedValue } from "./placeholder.service.js";
import { createModuleLogger } from "../lib/logger.js";

const log = createModuleLogger("event-processor");

export async function processEvent(eventId: string): Promise<void> {
  // 1. Fetch event
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    log.error({ eventId }, "Event not found");
    return;
  }

  if (event.processingStatus !== "PENDING") {
    log.warn({ eventId, status: event.processingStatus }, "Event already processed — skipping");
    return;
  }

  // 2. Mark as PROCESSING
  await prisma.event.update({
    where: { id: eventId },
    data: { processingStatus: "PROCESSING" },
  });

  const payload = event.payload as Record<string, unknown>;
  let hasFailures = false;
  let jobsCreated = 0;

  try {
    // 3. Find matching triggers
    const triggers = await findMatchingTriggers(event.userId, event.eventType);

    if (triggers.length === 0) {
      log.info({ eventId, eventType: event.eventType }, "No matching triggers found");
      await prisma.event.update({
        where: { id: eventId },
        data: { processingStatus: "COMPLETED", processedAt: new Date() },
      });
      return;
    }

    // 4. Process each trigger
    for (const trigger of triggers) {
      try {
        // 4a. Resolve recipient email from payload using trigger.recipientField
        const recipientEmail = getNestedValue(payload, trigger.recipientField);

        if (!recipientEmail || typeof recipientEmail !== "string") {
          log.warn(
            { triggerId: trigger.id, recipientField: trigger.recipientField },
            "Could not resolve recipient email from payload — skipping trigger",
          );
          continue;
        }

        // 4b. Evaluate trigger
        const shouldFire = await evaluateTrigger(trigger, payload, recipientEmail);

        if (!shouldFire) {
          continue;
        }

        // 4c. Render email
        const rendered = renderEmail(trigger.template, payload);

        // 4d. Create job + send + log in transaction
        await prisma.$transaction(async (tx) => {
          // Create EmailJob
          const job = await tx.emailJob.create({
            data: {
              userId: event.userId,
              eventId: event.id,
              triggerId: trigger.id,
              templateId: trigger.templateId,
              recipientEmail,
              renderedSubject: rendered.subject,
              renderedHtml: rendered.html,
              status: "PROCESSING",
            },
          });

          jobsCreated++;

          // Send email
          const result = await sendEmail({
            to: recipientEmail,
            subject: rendered.subject,
            html: rendered.html,
          });

          // Update job status
          await tx.emailJob.update({
            where: { id: job.id },
            data: {
              status: result.success ? "SENT" : "FAILED",
              providerMessageId: result.messageId,
              lastError: result.error ?? null,
              processedAt: new Date(),
            },
          });

          // Create SendLog
          await tx.sendLog.create({
            data: {
              userId: event.userId,
              emailJobId: job.id,
              recipientEmail,
              subject: rendered.subject,
              provider: "resend",
              providerMessageId: result.messageId,
              status: result.success ? "SUCCESS" : "FAILED",
              errorMessage: result.error ?? null,
            },
          });

          if (!result.success) {
            hasFailures = true;
          }

          log.info(
            {
              jobId: job.id,
              triggerId: trigger.id,
              recipientEmail,
              success: result.success,
            },
            "Email job processed",
          );
        });
      } catch (triggerError) {
        hasFailures = true;
        log.error(
          { triggerId: trigger.id, eventId, err: triggerError },
          "Error processing trigger — continuing with remaining triggers",
        );
      }
    }

    // 5. Update event status
    await prisma.event.update({
      where: { id: eventId },
      data: {
        processingStatus: hasFailures && jobsCreated === 0 ? "FAILED" : "COMPLETED",
        processedAt: new Date(),
        processingError: hasFailures ? "One or more triggers failed to process" : null,
      },
    });

    log.info(
      { eventId, jobsCreated, hasFailures },
      "Event processing completed",
    );
  } catch (err) {
    log.error({ eventId, err }, "Critical error during event processing");

    await prisma.event.update({
      where: { id: eventId },
      data: {
        processingStatus: "FAILED",
        processedAt: new Date(),
        processingError: err instanceof Error ? err.message : "Unknown error",
      },
    });
  }
}

export async function processJob(jobId: string): Promise<void> {
  const job = await prisma.emailJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    log.error({ jobId }, "Email job not found");
    return;
  }

  if (job.status !== "PENDING") {
    log.warn({ jobId, status: job.status }, "Email job is not in PENDING status — skipping");
    return;
  }

  // Update status to PROCESSING
  await prisma.emailJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  });

  const subject = job.renderedSubject || "";
  const html = job.renderedHtml || "";

  // Send email
  const result = await sendEmail({
    to: job.recipientEmail,
    subject,
    html,
  });

  // Update job status and log in transaction
  await prisma.$transaction(async (tx) => {
    await tx.emailJob.update({
      where: { id: job.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        providerMessageId: result.messageId,
        lastError: result.error ?? null,
        processedAt: new Date(),
      },
    });

    await tx.sendLog.create({
      data: {
        userId: job.userId,
        emailJobId: job.id,
        recipientEmail: job.recipientEmail,
        subject,
        provider: "resend",
        providerMessageId: result.messageId,
        status: result.success ? "SUCCESS" : "FAILED",
        errorMessage: result.error ?? null,
      },
    });
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to send email");
  }

  log.info({ jobId, success: result.success }, "Email job processing completed");
}
