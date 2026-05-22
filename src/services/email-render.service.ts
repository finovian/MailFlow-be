import { getNestedValue, extractPlaceholders } from "./placeholder.service.js";
import { createModuleLogger } from "../lib/logger.js";

const log = createModuleLogger("email-render");

const PLACEHOLDER_REGEX = /\{\{(\s*[\w.]+\s*)\}\}/g;

export function renderTemplate(
  templateString: string,
  payload: Record<string, unknown>,
): string {
  return templateString.replace(PLACEHOLDER_REGEX, (_match, path: string) => {
    const trimmedPath = path.trim();
    const value = getNestedValue(payload, trimmedPath);

    if (value === undefined || value === null) {
      log.warn({ placeholder: trimmedPath }, "Missing placeholder value during render");
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

  const templatePlaceholders = extractPlaceholders(template.subject + template.bodyHtml);
  const resolvedCount = templatePlaceholders.filter((p) => {
    const val = getNestedValue(payload, p);
    return val !== undefined && val !== null;
  }).length;

  log.debug(
    {
      totalPlaceholders: templatePlaceholders.length,
      resolved: resolvedCount,
    },
    "Email rendered",
  );

  return { subject, html };
}
