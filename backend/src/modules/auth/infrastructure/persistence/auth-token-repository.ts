import { and, eq, gt, isNull } from 'drizzle-orm';

import type { DatabaseExecutor } from '../../../../database/client.js';
import type {
  OneTimeTokenKind,
  OneTimeTokenRepository,
} from '../../application/auth-token-repository.js';
import { emailVerificationTokens, passwordResetTokens } from './schema.js';

export class DrizzleOneTimeTokenRepository implements OneTimeTokenRepository {
  public async create(
    kind: OneTimeTokenKind,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    executor: DatabaseExecutor,
  ): Promise<void> {
    const table = this.tableFor(kind);
    await executor.insert(table).values({ userId, tokenHash, expiresAt });
  }

  public async consume(
    kind: OneTimeTokenKind,
    tokenHash: string,
    executor: DatabaseExecutor,
  ): Promise<string | null> {
    const table = this.tableFor(kind);
    const [row] = await executor
      .update(table)
      .set({ usedAt: new Date() })
      .where(
        and(eq(table.tokenHash, tokenHash), isNull(table.usedAt), gt(table.expiresAt, new Date())),
      )
      .returning({ userId: table.userId });
    return row?.userId ?? null;
  }

  private tableFor(kind: OneTimeTokenKind) {
    return kind === 'email-verification' ? emailVerificationTokens : passwordResetTokens;
  }
}
