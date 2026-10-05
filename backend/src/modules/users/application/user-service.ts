import { NotFoundError } from '../../../shared/domain/app-error.js';
import type { DatabaseExecutor } from '../../../database/client.js';
import type { PublicUser } from '../domain/user.js';
import { toPublicUser } from '../domain/user.js';
import type { UserRepository } from './user-repository.js';

export class UserService {
  public constructor(private readonly users: UserRepository) {}

  public async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    return toPublicUser(user);
  }

  public async updateProfile(
    userId: string,
    input: {
      readonly firstName?: string | undefined;
      readonly lastName?: string | undefined;
      readonly displayName?: string | undefined;
    },
    executor: DatabaseExecutor,
  ): Promise<PublicUser> {
    return toPublicUser(await this.users.updateProfile(userId, input, executor));
  }
}
