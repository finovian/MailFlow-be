
import { EVENT_DEFINITIONS, type EventDefinition, type EventFieldDef } from "../config/event-definitions.js";


export function getEventDefinition(type: string): EventDefinition | undefined {
  return EVENT_DEFINITIONS.find((e) => e.type === type);
}


export function getAllEventDefinitions(): readonly EventDefinition[] {
  return EVENT_DEFINITIONS;
}


export function getEventFields(type: string): readonly EventFieldDef[] {
  return getEventDefinition(type)?.fields ?? [];
}


export function flattenPayloadSchema(
  schema: Record<string, unknown>,
  prefix = "",
): string[] {
  const result: string[] = [];
  for (const [key, value] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result.push(...flattenPayloadSchema(value as Record<string, unknown>, path));
    } else {
      result.push(path);
    }
  }
  return result;
}


export function getEventPayloadFields(type: string): string[] {
  const def = getEventDefinition(type);
  if (!def) return [];
  return flattenPayloadSchema(def.payloadSchema);
}

export function getEventMockPayload(type: string): Record<string, unknown> {
  return getEventDefinition(type)?.mockPayload ?? {};
}


export interface EventGroup {
  category: string;
  categoryLabel: string;
  items: readonly EventDefinition[];
}

export function getEventDefinitionsGrouped(): EventGroup[] {
  const map = new Map<string, { categoryLabel: string; items: EventDefinition[] }>();
  for (const def of EVENT_DEFINITIONS) {
    if (!map.has(def.category)) {
      map.set(def.category, { categoryLabel: def.categoryLabel, items: [] });
    }
    map.get(def.category)!.items.push(def as EventDefinition);
  }
  return Array.from(map.entries()).map(([category, { categoryLabel, items }]) => ({
    category,
    categoryLabel,
    items,
  }));
}

export function getEventTypeOptions(): { value: string; label: string }[] {
  return EVENT_DEFINITIONS.map((e) => ({ value: e.type, label: e.label }));
}
