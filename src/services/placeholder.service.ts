const PLACEHOLDER_REGEX = /\{\{(\s*[\w.]+\s*)\}\}/g;

export function extractPlaceholders(text: string): string[] {
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
    matches.add(match[1].trim());
  }

  return Array.from(matches);
}

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  // First, check if the path exists as a direct key (e.g., "user.name")
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }

  // Otherwise, traverse the object path
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export function validatePlaceholders(
  required: string[],
  payload: Record<string, unknown>,
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const placeholder of required) {
    const value = getNestedValue(payload, placeholder);
    if (value === undefined || value === null) {
      missing.push(placeholder);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
