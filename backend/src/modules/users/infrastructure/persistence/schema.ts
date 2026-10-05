import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn, updatedAtColumn } from '../../../../database/schema/common.js';

export const users = pgTable(
  'users',
  {
    id: idColumn(),
    email: varchar('email', { length: 320 }).notNull(),
    normalizedEmail: varchar('normalized_email', { length: 320 }).notNull(),
    passwordHash: text('password_hash'),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    displayName: varchar('display_name', { length: 200 }),
    avatarUrl: text('avatar_url'),
    phoneNumber: varchar('phone_number', { length: 32 }),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    status: varchar('status', { length: 32 }).notNull().default('active'),
    locale: varchar('locale', { length: 16 }).notNull().default('en'),
    timezone: varchar('timezone', { length: 64 }).notNull().default('UTC'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    lastLoginIp: varchar('last_login_ip', { length: 64 }),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    analyticsOptOut: boolean('analytics_opt_out').notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('users_normalized_email_unique').on(table.normalizedEmail),
    index('users_status_index').on(table.status),
    index('users_deleted_at_index').on(table.deletedAt),
  ],
);
