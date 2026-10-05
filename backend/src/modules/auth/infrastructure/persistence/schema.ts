import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn, updatedAtColumn } from '../../../../database/schema/common.js';
import { users } from '../../../users/index.js';

export const authAccounts = pgTable(
  'auth_accounts',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 32 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    providerEmail: varchar('provider_email', { length: 320 }),
    providerEmailVerified: boolean('provider_email_verified').notNull().default(false),
    accessTokenEncrypted: text('access_token_encrypted'),
    refreshTokenEncrypted: text('refresh_token_encrypted'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex('auth_accounts_provider_account_unique').on(
      table.provider,
      table.providerAccountId,
    ),
    index('auth_accounts_user_index').on(table.userId),
  ],
);

export const emailVerificationTokens = pgTable(
  'email_verification_tokens',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex('email_verification_tokens_hash_unique').on(table.tokenHash),
    index('email_verification_tokens_user_index').on(table.userId),
  ],
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex('password_reset_tokens_hash_unique').on(table.tokenHash),
    index('password_reset_tokens_user_index').on(table.userId),
  ],
);
