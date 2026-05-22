import { resend } from "../lib/resend.js";
import { env } from "../config/env.js";
import { createModuleLogger } from "../lib/logger.js";

const log = createModuleLogger("resend-service");

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string | null;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html } = params;

  try {
    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      log.error({ to, subject, error }, "Resend API returned error");
      return {
        success: false,
        messageId: null,
        error: error.message,
      };
    }

    log.info({ to, subject, messageId: data?.id }, "Email sent successfully");
    return {
      success: true,
      messageId: data?.id ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error({ to, subject, err }, "Failed to send email via Resend");
    return {
      success: false,
      messageId: null,
      error: message,
    };
  }
}
