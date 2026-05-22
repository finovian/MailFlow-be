import { inngest } from "./client.js";
import { processEvent, processJob } from "../services/event-processor.service.js";

// Inngest function for processing a new event
export const processEmailEvent = inngest.createFunction(
  {
    id: "process-email-event",
    name: "Process Email Event",
    retries: 3,
    triggers: [{ event: "app/event.received" }],
  },
  async ({ event, step }) => {
    const { eventId } = event.data as { eventId: string };
    await step.run("process-event", async () => {
      await processEvent(eventId);
    });
  }
);




// Inngest function for retrying a failed job
export const processJobRetry = inngest.createFunction(
  {
    id: "process-job-retry",
    name: "Process Job Retry",
    retries: 3,
    triggers: [{ event: "app/job.retry" }],
  },
  async ({ event, step }) => {
    const { jobId } = event.data as { jobId: string };
    await step.run("process-job-retry", async () => {
      await processJob(jobId);
    });
  }
);
