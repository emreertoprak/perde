import type { DatabaseExecutor, DatabaseTransaction } from '../../../database/client.js';
import type { Session, SessionDeviceInput } from '../domain/session.js';

export interface CreateSessionInput extends SessionDeviceInput {
  readonly id: string;
  readonly userId: string;
  readonly tokenFamilyId: string;
  readonly refreshTokenHash: string;
  readonly expiresAt: Date;
}

export interface SessionRepository {
  create(input: CreateSessionInput, executor: DatabaseExecutor): Promise<Session>;
  findById(id: string, executor?: DatabaseExecutor): Promise<Session | null>;
  findByIdForUpdate(id: string, transaction: DatabaseTransaction): Promise<Session | null>;
  listActiveByUser(userId: string): Promise<readonly Session[]>;
  revoke(
    sessionId: string,
    reason: string,
    replacedBySessionId: string | null,
    executor: DatabaseExecutor,
  ): Promise<void>;
  revokeFamily(
    userId: string,
    familyId: string,
    reason: string,
    executor: DatabaseExecutor,
  ): Promise<void>;
  revokeAllForUser(userId: string, reason: string, executor: DatabaseExecutor): Promise<void>;
  touch(sessionId: string, executor: DatabaseExecutor): Promise<void>;
  updateRefreshTokenHash(
    sessionId: string,
    refreshTokenHash: string,
    executor: DatabaseExecutor,
  ): Promise<void>;
}
