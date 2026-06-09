import { getNestedValue } from "./placeholder.service.js";
import { createModuleLogger } from "../lib/logger.js";

const log = createModuleLogger("email-render");

const PLACEHOLDER_REGEX = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function renderTemplate(
  templateString: string,
  payload: Record<string, unknown>,
): string {
  return templateString.replace(PLACEHOLDER_REGEX, (_match, path: string) => {
    const value = getNestedValue(payload, path);

    if (value === undefined || value === null) {
      log.warn({ placeholder: path }, "Missing placeholder value during render");
      return "";
    }

    return String(value);
  });
}

export function renderEmail(
  template: { subject: string; bodyHtml: string },
  payload: Record<string, unknown>,
): { subject: string; html: string } {
  const subject = renderTemplate(template.subject, payload);
  const html = renderTemplate(template.bodyHtml, payload);


  return { subject, html };
}
