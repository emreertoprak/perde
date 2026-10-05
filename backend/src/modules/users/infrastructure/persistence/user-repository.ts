import { and, eq, isNull, sql } from 'drizzle-orm';

import type { DatabaseExecutor } from '../../../../database/client.js';
import { NotFoundError } from '../../../../shared/domain/app-error.js';
import type { CreateUserInput, UserRepository } from '../../application/user-repository.js';
import type { User } from '../../domain/user.js';
import { users } from './schema.js';

const userSelection = {
  id: users.id,
  email: users.email,
  normalizedEmail: users.normalizedEmail,
  passwordHash: users.passwordHash,
  firstName: users.firstName,
  lastName: users.lastName,
  displayName: users.displayName,
  emailVerifiedAt: users.emailVerifiedAt,
  status: users.status,
  failedLoginAttempts: users.failedLoginAttempts,
  lockedUntil: users.lockedUntil,
  analyticsOptOut: users.analyticsOptOut,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

interface UserRow {
  readonly id: string;
  readonly email: string;
  readonly normalizedEmail: string;
  readonly passwordHash: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly displayName: string | null;
  readonly emailVerifiedAt: Date | null;
  readonly status: string;
  readonly failedLoginAttempts: number;
  readonly lockedUntil: Date | null;
  readonly analyticsOptOut: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    normalizedEmail: row.normalizedEmail,
    passwordHash: row.passwordHash,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName: row.displayName,
    emailVerifiedAt: row.emailVerifiedAt,
    status: row.status as User['status'],
    failedLoginAttempts: row.failedLoginAttempts,
    lockedUntil: row.lockedUntil,
    analyticsOptOut: row.analyticsOptOut,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleUserRepository implements UserRepository {
  public constructor(private readonly database: DatabaseExecutor) {}

  public async findById(
    id: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<User | null> {
    const [row] = await executor
      .select(userSelection)
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return row ? mapUser(row) : null;
  }

  public async findByNormalizedEmail(
    normalizedEmail: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<User | null> {
    const [row] = await executor
      .select(userSelection)
      .from(users)
      .where(and(eq(users.normalizedEmail, normalizedEmail), isNull(users.deletedAt)))
      .limit(1);
    return row ? mapUser(row) : null;
  }

  public async create(input: CreateUserInput, executor: DatabaseExecutor): Promise<User> {
    const [row] = await executor
      .insert(users)
      .values({
        email: input.email,
        normalizedEmail: input.normalizedEmail,
        passwordHash: input.passwordHash,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        displayName: input.displayName ?? null,
      })
      .returning(userSelection);
    if (!row) throw new Error('User insert returned no row');
    return mapUser(row);
  }

  public async markLoginSuccess(
    userId: string,
    ipAddress: string | undefined,
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor
      .update(users)
      .set({
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress ?? null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  public async markLoginFailure(
    userId: string,
    lockUntil: Date | null,
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor
      .update(users)
      .set({
        failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
        lockedUntil: lockUntil,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  public async setEmailVerified(userId: string, executor: DatabaseExecutor): Promise<void> {
    await executor
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  public async updatePassword(
    userId: string,
    passwordHash: string,
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  public async updateProfile(
    userId: string,
    input: Pick<CreateUserInput, 'firstName' | 'lastName' | 'displayName'>,
    executor: DatabaseExecutor,
  ): Promise<User> {
    const [row] = await executor
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning(userSelection);
    if (!row) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    return mapUser(row);
  }

  public async setStatus(
    userId: string,
    status: 'active' | 'inactive',
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  public async anonymize(
    userId: string,
    tombstoneEmail: string,
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor
      .update(users)
      .set({
        email: tombstoneEmail,
        normalizedEmail: tombstoneEmail,
        passwordHash: null,
        firstName: null,
        lastName: null,
        displayName: 'Deleted user',
        avatarUrl: null,
        phoneNumber: null,
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
