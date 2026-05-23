export interface EventFieldDef {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date';
}


export interface EventDefinition {
  type: string;

  label: string;

  category: string;

  categoryLabel: string;

  description?: string;

  fields: readonly EventFieldDef[];

  payloadSchema: Record<string, unknown>;

  mockPayload: Record<string, unknown>;
}

export const EVENT_DEFINITIONS: readonly EventDefinition[] = [
  // ─── User Events ────────────────────────────────────────────────────────────
  {
    type: 'user.created',
    label: 'User Created',
    category: 'user',
    categoryLabel: 'User Events',
    description: 'Fires when a new user account is created.',
    fields: [
      { name: 'user.email', label: 'Email', type: 'string' },
      { name: 'user.name', label: 'Name', type: 'string' },
      { name: 'user.createdAt', label: 'Created At', type: 'date' },
    ],
    payloadSchema: {
      user: { email: 'string', name: 'string', createdAt: 'date' },
    },
    mockPayload: {
      user: { email: 'jay@example.com', name: 'Jay', createdAt: '2026-05-22T10:00:00Z' },
    },
  },
  {
    type: 'user.updated',
    label: 'User Updated',
    category: 'user',
    categoryLabel: 'User Events',
    description: 'Fires when a user profile is updated.',
    fields: [
      { name: 'user.email', label: 'Email', type: 'string' },
      { name: 'user.name', label: 'Name', type: 'string' },
      { name: 'user.plan', label: 'Plan', type: 'string' },
    ],
    payloadSchema: {
      user: { email: 'string', name: 'string', plan: 'string' },
    },
    mockPayload: {
      user: { email: 'jay@example.com', name: 'Jay', plan: 'pro' },
    },
  },
  {
    type: 'user.deleted',
    label: 'User Deleted',
    category: 'user',
    categoryLabel: 'User Events',
    description: 'Fires when a user account is permanently deleted.',
    fields: [
      { name: 'user.email', label: 'Email', type: 'string' },
      { name: 'user.name', label: 'Name', type: 'string' },
    ],
    payloadSchema: {
      user: { email: 'string', name: 'string' },
    },
    mockPayload: {
      user: { email: 'jay@example.com', name: 'Jay' },
    },
  },

  // ─── Event Events ────────────────────────────────────────────────────────────
  {
    type: 'event.completed',
    label: 'Event Completed',
    category: 'event',
    categoryLabel: 'Event Events',
    description: 'Fires when a scheduled event is marked as completed.',
    fields: [
      { name: 'event.name', label: 'Event Name', type: 'string' },
      { name: 'event.date', label: 'Event Date', type: 'date' },
      { name: 'event.attendees', label: 'Attendees', type: 'number' },
    ],
    payloadSchema: {
      event: { name: 'string', date: 'date', attendees: 'number' },
    },
    mockPayload: {
      event: { name: 'Q2 Webinar', date: '2026-06-01T14:00:00Z', attendees: 340 },
    },
  },
  {
    type: 'event.cancelled',
    label: 'Event Cancelled',
    category: 'event',
    categoryLabel: 'Event Events',
    description: 'Fires when a scheduled event is cancelled.',
    fields: [
      { name: 'event.name', label: 'Event Name', type: 'string' },
      { name: 'event.date', label: 'Event Date', type: 'date' },
      { name: 'event.reason', label: 'Reason', type: 'string' },
    ],
    payloadSchema: {
      event: { name: 'string', date: 'date', reason: 'string' },
    },
    mockPayload: {
      event: { name: 'Q2 Webinar', date: '2026-06-01T14:00:00Z', reason: 'Speaker unavailable' },
    },
  },
  {
    type: 'event.reminder',
    label: 'Event Reminder',
    category: 'event',
    categoryLabel: 'Event Events',
    description: 'Fires as a reminder before a scheduled event.',
    fields: [
      { name: 'event.name', label: 'Event Name', type: 'string' },
      { name: 'event.date', label: 'Event Date', type: 'date' },
      { name: 'event.daysUntil', label: 'Days Until Event', type: 'number' },
    ],
    payloadSchema: {
      event: { name: 'string', date: 'date', daysUntil: 'number' },
    },
    mockPayload: {
      event: { name: 'Q2 Webinar', date: '2026-06-01T14:00:00Z', daysUntil: 3 },
    },
  },

  // ─── Send History Events ─────────────────────────────────────────────────────
  {
    type: 'send_history.bounced',
    label: 'Email Bounced',
    category: 'send_history',
    categoryLabel: 'Send History Events',
    description: 'Fires when a sent email hard-bounces.',
    fields: [
      { name: 'send_history.recipient', label: 'Recipient', type: 'string' },
      { name: 'send_history.templateId', label: 'Template ID', type: 'string' },
      { name: 'send_history.bouncedAt', label: 'Bounced At', type: 'date' },
    ],
    payloadSchema: {
      send_history: { recipient: 'string', templateId: 'string', bouncedAt: 'date' },
    },
    mockPayload: {
      send_history: {
        recipient: 'user@example.com',
        templateId: 'tmpl_welcome',
        bouncedAt: '2026-05-22T09:00:00Z',
      },
    },
  },
  {
    type: 'send_history.opened',
    label: 'Email Opened',
    category: 'send_history',
    categoryLabel: 'Send History Events',
    description: 'Fires when a recipient opens a sent email.',
    fields: [
      { name: 'send_history.recipient', label: 'Recipient', type: 'string' },
      { name: 'send_history.templateId', label: 'Template ID', type: 'string' },
      { name: 'send_history.openedAt', label: 'Opened At', type: 'date' },
    ],
    payloadSchema: {
      send_history: { recipient: 'string', templateId: 'string', openedAt: 'date' },
    },
    mockPayload: {
      send_history: {
        recipient: 'user@example.com',
        templateId: 'tmpl_welcome',
        openedAt: '2026-05-22T11:30:00Z',
      },
    },
  },
  {
    type: 'send_history.clicked',
    label: 'Link Clicked',
    category: 'send_history',
    categoryLabel: 'Send History Events',
    description: 'Fires when a recipient clicks a link in a sent email.',
    fields: [
      { name: 'send_history.recipient', label: 'Recipient', type: 'string' },
      { name: 'send_history.templateId', label: 'Template ID', type: 'string' },
      { name: 'send_history.url', label: 'Clicked URL', type: 'string' },
    ],
    payloadSchema: {
      send_history: { recipient: 'string', templateId: 'string', url: 'string' },
    },
    mockPayload: {
      send_history: {
        recipient: 'user@example.com',
        templateId: 'tmpl_welcome',
        url: 'https://example.com/upgrade',
      },
    },
  },
];
