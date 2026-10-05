import { index, pgTable, primaryKey, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { createdAtColumn, idColumn, updatedAtColumn } from '../../../../database/schema/common.js';
import { permissions } from '../../../permissions/index.js';
import { users } from '../../../users/index.js';

export const roles = pgTable(
  'roles',
  {
    id: idColumn(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    description: varchar('description', { length: 500 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [uniqueIndex('roles_slug_unique').on(table.slug)],
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index('user_roles_role_index').on(table.roleId),
  ],
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index('role_permissions_permission_index').on(table.permissionId),
  ],
);
