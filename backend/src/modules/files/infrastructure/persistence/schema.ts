import { bigint, index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn, updatedAtColumn } from '../../../../database/schema/common.js';
import { users } from '../../../users/index.js';

export const files = pgTable(
  'files',
  {
    id: idColumn(),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    storageProvider: varchar('storage_provider', { length: 32 }).notNull(),
    bucket: varchar('bucket', { length: 255 }),
    storageKey: text('storage_key').notNull(),
    originalName: varchar('original_name', { length: 500 }).notNull(),
    mimeType: varchar('mime_type', { length: 255 }).notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    visibility: varchar('visibility', { length: 16 }).notNull().default('private'),
    checksumSha256: varchar('checksum_sha256', { length: 64 }).notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index('files_owner_index').on(table.ownerUserId, table.deletedAt),
    index('files_storage_key_index').on(table.storageKey),
  ],
);
