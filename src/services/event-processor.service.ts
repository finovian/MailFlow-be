import { prisma } from "../lib/prisma.js";
import { findMatchingTriggers, evaluateTrigger } from "./trigger-engine.service.js";
import { renderEmail } from "./email-render.service.js";
import { sendEmail } from "./resend.service.js";
import { getNestedValue } from "./placeholder.service.js";
import { createModuleLogger } from "../lib/logger.js";

const log = createModuleLogger("event-processor");

export async function processEvent(eventId: string): Promise<void> {
  const timeline: any[] = [];

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    log.error({ eventId }, "Event not found");
    return;
  }

  if (
    event.processingStatus !== "PENDING" &&
    event.processingStatus !== "FAILED"
  ) {
    log.warn({ eventId, status: event.processingStatus }, "Event already processed — skipping");
    return;
  }

  timeline.push({
    step: "EVENT_INGESTED",
    status: "SUCCESS",
    message: "Payload stored successfully",
  });

  timeline.push({
    step: "WORKFLOW_TRIGGERED",
    status: "SUCCESS",
    message: "Inngest workflow started",
  });

  await prisma.event.update({
    where: { id: eventId },
    data: { processingStatus: "PROCESSING" },
  });

  const payload = event.payload as Record<string, unknown>;
  let hasFailures = false;
  let jobsCreated = 0;

  try {
    const triggers = await findMatchingTriggers(event.userId, event.eventType);

    if (triggers.length === 0) {
      log.info({ eventId, eventType: event.eventType }, "No matching triggers found");

      timeline.push({
        step: "TRIGGER_MATCHING",
        status: "SKIPPED",
        message: `No matching automation triggers found for event type "${event.eventType}"`,
      });

      await prisma.event.update({
        where: { id: eventId },
        data: {
          processingStatus: "COMPLETED",
          processedAt: new Date(),
          processingError: JSON.stringify({ timeline }),
        },
      });
      return;
    }

    for (const trigger of triggers) {
      try {
        const recipientEmail = getNestedValue(payload, trigger.recipientField);

        if (!recipientEmail || typeof recipientEmail !== "string") {
          log.warn(
            { triggerId: trigger.id, recipientField: trigger.recipientField },
            "Could not resolve recipient email from payload — skipping trigger",
          );

          timeline.push({
            step: "TRIGGER_EVALUATED",
            status: "SKIPPED",
            triggerName: trigger.name,
            message: "Could not resolve recipient email from payload",
          });
          continue;
        }

        const evalResult = await evaluateTrigger(trigger, payload, recipientEmail);

        if (!evalResult.passed) {
          timeline.push({
            step: "TRIGGER_EVALUATED",
            status: "SKIPPED",
            triggerName: trigger.name,
            message: "Trigger conditions were not met",
            details: evalResult.failedCondition,
          });
          continue;
        }

        timeline.push({
          step: "TRIGGER_EVALUATED",
          status: "SUCCESS",
          triggerName: trigger.name,
          message: "Conditions met",
        });

        const rendered = renderEmail(trigger.template, payload);

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

          timeline.push({
            step: "EMAIL_JOB_CREATED",
            status: "SUCCESS",
            message: `Email job created for ${recipientEmail}`,
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

          timeline.push({
            step: "EMAIL_SENT",
            status: result.success ? "SUCCESS" : "FAILED",
            message: result.success ? "Email sent successfully" : result.error,
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

        timeline.push({
          step: "FAILED",
          status: "FAILED",
          message: triggerError instanceof Error ? triggerError.message : "Unknown error processing trigger",
        });
      }
    }
    if (jobsCreated === 0 && !hasFailures) {
      timeline.push({
        step: "TRIGGER_EVALUATED",
        status: "SKIPPED",
        message: "Automation flow stopped: No triggers met the required conditions",
      });
    }

    // 5. Update event status
    await prisma.event.update({
      where: { id: eventId },
      data: {
        processingStatus: hasFailures && jobsCreated === 0 ? "FAILED" : "COMPLETED",
        processedAt: new Date(),
        processingError: JSON.stringify({
          timeline,
        }),
      },
    });

    log.info(
      { eventId, jobsCreated, hasFailures },
      "Event processing completed",
    );
  } catch (err) {
    log.error({ eventId, err }, "Critical error during event processing");

    timeline.push({
      step: "FAILED",
      status: "FAILED",
      message:
        err instanceof Error
          ? err.message
          : "Critical processing error",
    });

    await prisma.event.update({
      where: { id: eventId },
      data: {
        processingStatus: "FAILED",
        processedAt: new Date(),
        processingError: JSON.stringify({
          timeline,
          error:
            err instanceof Error
              ? err.message
              : "Unknown error",
        }),
      },
    });

    throw err;
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

  await prisma.emailJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  });

  const subject = job.renderedSubject || "";
  const html = job.renderedHtml || "";


  const result = await sendEmail({
    to: job.recipientEmail,
    subject,
    html,
  });


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
