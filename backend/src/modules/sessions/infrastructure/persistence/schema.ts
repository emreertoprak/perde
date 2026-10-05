import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn, updatedAtColumn } from '../../../../database/schema/common.js';
import { users } from '../../../users/index.js';

export const sessions = pgTable(
  'sessions',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenFamilyId: uuid('token_family_id').notNull(),
    refreshTokenHash: varchar('refresh_token_hash', { length: 128 }).notNull(),
    deviceId: varchar('device_id', { length: 255 }),
    deviceName: varchar('device_name', { length: 255 }),
    platform: varchar('platform', { length: 100 }),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokeReason: varchar('revoke_reason', { length: 100 }),
    replacedBySessionId: uuid('replaced_by_session_id'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex('sessions_refresh_token_hash_unique').on(table.refreshTokenHash),
    index('sessions_user_family_index').on(table.userId, table.tokenFamilyId),
    index('sessions_active_index').on(table.userId, table.revokedAt, table.expiresAt),
  ],
);
