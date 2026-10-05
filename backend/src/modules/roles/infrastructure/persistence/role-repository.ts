import { eq, inArray } from 'drizzle-orm';

import type { DatabaseExecutor } from '../../../../database/client.js';
import { NotFoundError } from '../../../../shared/domain/app-error.js';
import { permissions } from '../../../permissions/index.js';
import type { RoleRepository } from '../../application/role-repository.js';
import { rolePermissions, roles, userRoles } from './schema.js';

export class DrizzleRoleRepository implements RoleRepository {
  public constructor(private readonly database: DatabaseExecutor) {}

  public async assignRoleBySlug(
    userId: string,
    roleSlug: string,
    executor: DatabaseExecutor,
  ): Promise<void> {
    const [role] = await executor
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.slug, roleSlug))
      .limit(1);
    if (!role) throw new NotFoundError('ROLE_NOT_FOUND', `Role ${roleSlug} was not found`);
    await executor.insert(userRoles).values({ userId, roleId: role.id }).onConflictDoNothing();
  }

  public async replaceUserRoles(
    userId: string,
    roleIds: readonly string[],
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor.delete(userRoles).where(eq(userRoles.userId, userId));
    if (roleIds.length === 0) return;
    const foundRoles = await executor
      .select({ id: roles.id })
      .from(roles)
      .where(inArray(roles.id, [...roleIds]));
    if (foundRoles.length !== roleIds.length)
      throw new NotFoundError('ROLE_NOT_FOUND', 'One or more roles were not found');
    await executor.insert(userRoles).values(roleIds.map((roleId) => ({ userId, roleId })));
  }

  public async getRoleSlugsForUser(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<readonly string[]> {
    const rows = await executor
      .select({ slug: roles.slug })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    return rows.map((row) => row.slug);
  }

  public async getPermissionSlugsForUser(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<readonly string[]> {
    const rows = await executor
      .selectDistinct({ slug: permissions.slug })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));
    return rows.map((row) => row.slug);
  }
}
