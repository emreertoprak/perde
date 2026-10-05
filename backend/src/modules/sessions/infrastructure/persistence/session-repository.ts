import { and, eq, gt, isNull } from 'drizzle-orm';

import type { DatabaseExecutor, DatabaseTransaction } from '../../../../database/client.js';
import type {
  CreateSessionInput,
  SessionRepository,
} from '../../application/session-repository.js';
import type { Session } from '../../domain/session.js';
import { sessions } from './schema.js';

const sessionSelection = {
  id: sessions.id,
  userId: sessions.userId,
  tokenFamilyId: sessions.tokenFamilyId,
  refreshTokenHash: sessions.refreshTokenHash,
  deviceId: sessions.deviceId,
  deviceName: sessions.deviceName,
  platform: sessions.platform,
  userAgent: sessions.userAgent,
  ipAddress: sessions.ipAddress,
  lastUsedAt: sessions.lastUsedAt,
  expiresAt: sessions.expiresAt,
  revokedAt: sessions.revokedAt,
  revokeReason: sessions.revokeReason,
  replacedBySessionId: sessions.replacedBySessionId,
  createdAt: sessions.createdAt,
};

function mapSession(row: typeof sessionSelection extends never ? never : Session): Session {
  return row;
}

export class DrizzleSessionRepository implements SessionRepository {
  public constructor(private readonly database: DatabaseExecutor) {}

  public async create(input: CreateSessionInput, executor: DatabaseExecutor): Promise<Session> {
    const [row] = await executor
      .insert(sessions)
      .values({
        ...input,
        deviceId: input.deviceId ?? null,
        deviceName: input.deviceName ?? null,
        platform: input.platform ?? null,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        lastUsedAt: new Date(),
      })
      .returning(sessionSelection);
    if (!row) throw new Error('Session insert returned no row');
    return mapSession(row);
  }

  public async findById(
    id: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<Session | null> {
    const [row] = await executor
      .select(sessionSelection)
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    return row ? mapSession(row) : null;
  }

  public async findByIdForUpdate(
    id: string,
    transaction: DatabaseTransaction,
  ): Promise<Session | null> {
    const [row] = await transaction
      .select(sessionSelection)
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1)
      .for('update');
    return row ? mapSession(row) : null;
  }

  public async listActiveByUser(userId: string): Promise<readonly Session[]> {
    const rows = await this.database
      .select(sessionSelection)
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
        ),
      );
    return rows.map(mapSession);
  }

  public async revoke(
    sessionId: string,
    reason: string,
    replacedBySessionId: string | null,
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor
      .update(sessions)
      .set({
        revokedAt: new Date(),
        revokeReason: reason,
        replacedBySessionId,
        updatedAt: new Date(),
      })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
  }

  public async revokeFamily(
    userId: string,
    familyId: string,
    reason: string,
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor
      .update(sessions)
      .set({ revokedAt: new Date(), revokeReason: reason, updatedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.tokenFamilyId, familyId),
          isNull(sessions.revokedAt),
        ),
      );
  }

  public async revokeAllForUser(
    userId: string,
    reason: string,
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor
      .update(sessions)
      .set({ revokedAt: new Date(), revokeReason: reason, updatedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }

  public async touch(sessionId: string, executor: DatabaseExecutor): Promise<void> {
    await executor
      .update(sessions)
      .set({ lastUsedAt: new Date(), updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  public async updateRefreshTokenHash(
    sessionId: string,
    refreshTokenHash: string,
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor
      .update(sessions)
      .set({ refreshTokenHash, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }
}
