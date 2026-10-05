import { index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn, updatedAtColumn } from '../../../../database/schema/common.js';
import { users } from '../../../users/index.js';

export const notifications = pgTable(
  'notifications',
  {
    id: idColumn(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    channel: varchar('channel', { length: 32 }).notNull(),
    type: varchar('type', { length: 100 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    recipient: varchar('recipient', { length: 320 }).notNull(),
    subject: varchar('subject', { length: 500 }),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    readAt: timestamp('read_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index('notifications_user_status_index').on(table.userId, table.status)],
);
