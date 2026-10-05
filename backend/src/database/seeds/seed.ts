import { createDatabase } from '../client.js';
import { loadEnv } from '../../config/env.js';
import { permissions, roles, rolePermissions } from '../schema/index.js';

const config = loadEnv();
const { db, sql } = createDatabase(config);

const roleDefinitions = [
  { name: 'Super Admin', slug: 'super-admin', description: 'Unrestricted system administrator' },
  { name: 'Admin', slug: 'admin', description: 'Administrative user' },
  { name: 'User', slug: 'user', description: 'Standard authenticated user' },
] as const;
const permissionDefinitions = [
  { name: 'Read users', slug: 'users.read', description: 'View user records' },
  { name: 'Create users', slug: 'users.create', description: 'Create user records' },
  { name: 'Update users', slug: 'users.update', description: 'Update user records' },
  { name: 'Delete users', slug: 'users.delete', description: 'Delete user records' },
  { name: 'Manage roles', slug: 'roles.manage', description: 'Manage roles and permissions' },
  { name: 'Read audit logs', slug: 'audit-logs.read', description: 'View immutable audit records' },
] as const;

try {
  await db.transaction(async (transaction) => {
    for (const role of roleDefinitions) {
      await transaction
        .insert(roles)
        .values(role)
        .onConflictDoUpdate({ target: roles.slug, set: role });
    }
    for (const permission of permissionDefinitions) {
      await transaction
        .insert(permissions)
        .values(permission)
        .onConflictDoUpdate({ target: permissions.slug, set: permission });
    }
    const allRoles = await transaction.select({ id: roles.id, slug: roles.slug }).from(roles);
    const allPermissions = await transaction
      .select({ id: permissions.id, slug: permissions.slug })
      .from(permissions);
    const superAdmin = allRoles.find((role) => role.slug === 'super-admin');
    if (!superAdmin) throw new Error('Seeded super-admin role was not found');
    for (const permission of allPermissions) {
      await transaction
        .insert(rolePermissions)
        .values({ roleId: superAdmin.id, permissionId: permission.id })
        .onConflictDoNothing();
    }
    const admin = allRoles.find((role) => role.slug === 'admin');
    if (!admin) throw new Error('Seeded admin role was not found');
    for (const permission of allPermissions.filter(
      (permission) => permission.slug !== 'users.delete',
    )) {
      await transaction
        .insert(rolePermissions)
        .values({ roleId: admin.id, permissionId: permission.id })
        .onConflictDoNothing();
    }
    const user = allRoles.find((role) => role.slug === 'user');
    const readUsers = allPermissions.find((permission) => permission.slug === 'users.read');
    if (!user || !readUsers)
      throw new Error('Seeded user role or users.read permission was not found');
    await transaction
      .insert(rolePermissions)
      .values({ roleId: user.id, permissionId: readUsers.id })
      .onConflictDoNothing();
  });
  process.stdout.write('Database seed completed\n');
} finally {
  await sql.end({ timeout: 10 });
}
