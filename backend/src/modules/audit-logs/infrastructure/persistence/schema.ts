import { index, jsonb, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn } from '../../../../database/schema/common.js';
import { users } from '../../../users/index.js';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: idColumn(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 160 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }),
    oldValues: jsonb('old_values').$type<Record<string, unknown>>(),
    newValues: jsonb('new_values').$type<Record<string, unknown>>(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    requestId: varchar('request_id', { length: 128 }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('audit_logs_actor_created_index').on(table.actorUserId, table.createdAt),
    index('audit_logs_entity_index').on(table.entityType, table.entityId),
    index('audit_logs_action_created_index').on(table.action, table.createdAt),
  ],
);
