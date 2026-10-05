import type { DatabaseExecutor } from '../../../database/client.js';

export interface RoleRepository {
  assignRoleBySlug(userId: string, roleSlug: string, executor: DatabaseExecutor): Promise<void>;
  replaceUserRoles(
    userId: string,
    roleIds: readonly string[],
    executor: DatabaseExecutor,
  ): Promise<void>;
  getRoleSlugsForUser(userId: string, executor?: DatabaseExecutor): Promise<readonly string[]>;
  getPermissionSlugsForUser(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<readonly string[]>;
}
