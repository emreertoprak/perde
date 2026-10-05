import { pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn, updatedAtColumn } from '../../../../database/schema/common.js';

export const permissions = pgTable(
  'permissions',
  {
    id: idColumn(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    description: varchar('description', { length: 500 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [uniqueIndex('permissions_slug_unique').on(table.slug)],
);
