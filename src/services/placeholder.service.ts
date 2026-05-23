const PLACEHOLDER_REGEX = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function extractPlaceholders(text: string): string[] {
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
    matches.add(match[1]);
  }

  return Array.from(matches);
}

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }


  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }

  // Otherwise, traverse the object path
  const keys = path.split(".");
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[key];
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
