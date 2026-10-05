import { timestamp, uuid } from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';

export const idColumn = () => uuid('id').primaryKey().$defaultFn(uuidv7);
export const createdAtColumn = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
export const updatedAtColumn = () =>
  timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();
