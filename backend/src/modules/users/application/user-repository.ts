import type { DatabaseExecutor } from '../../../database/client.js';
import type { User } from '../domain/user.js';

export interface CreateUserInput {
  readonly email: string;
  readonly normalizedEmail: string;
  readonly passwordHash: string;
  readonly firstName?: string | undefined;
  readonly lastName?: string | undefined;
  readonly displayName?: string | undefined;
}

export interface UserRepository {
  findById(id: string, executor?: DatabaseExecutor): Promise<User | null>;
  findByNormalizedEmail(normalizedEmail: string, executor?: DatabaseExecutor): Promise<User | null>;
  create(input: CreateUserInput, executor: DatabaseExecutor): Promise<User>;
  markLoginSuccess(
    userId: string,
    ipAddress: string | undefined,
    executor: DatabaseExecutor,
  ): Promise<void>;
  markLoginFailure(
    userId: string,
    lockUntil: Date | null,
    executor: DatabaseExecutor,
  ): Promise<void>;
  setEmailVerified(userId: string, executor: DatabaseExecutor): Promise<void>;
  updatePassword(userId: string, passwordHash: string, executor: DatabaseExecutor): Promise<void>;
  updateProfile(
    userId: string,
    input: Pick<CreateUserInput, 'firstName' | 'lastName' | 'displayName'>,
    executor: DatabaseExecutor,
  ): Promise<User>;
  setStatus(
    userId: string,
    status: 'active' | 'inactive',
    executor: DatabaseExecutor,
  ): Promise<void>;
  anonymize(userId: string, tombstoneEmail: string, executor: DatabaseExecutor): Promise<void>;
}
