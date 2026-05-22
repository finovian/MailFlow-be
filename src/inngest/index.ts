import { serve } from "inngest/express";
import { inngest } from "./client.js";
import { processEmailEvent, processJobRetry } from "./functions.js";

export const inngestHandler = serve({
  client: inngest,
  functions: [processEmailEvent, processJobRetry],
});
