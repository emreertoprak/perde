import { index, integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn } from '../../../database/schema/common.js';

export const outboxEvents = pgTable(
  'outbox_events',
  {
    id: idColumn(),
    aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 64 }).notNull(),
    eventType: varchar('event_type', { length: 160 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: createdAtColumn(),
  },
  (table) => [index('outbox_events_pending_index').on(table.publishedAt, table.nextAttemptAt)],
);
