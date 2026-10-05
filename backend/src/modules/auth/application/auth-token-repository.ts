import type { DatabaseExecutor } from '../../../database/client.js';

export type OneTimeTokenKind = 'email-verification' | 'password-reset';

export interface OneTimeTokenRepository {
  create(
    kind: OneTimeTokenKind,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    executor: DatabaseExecutor,
  ): Promise<void>;
  consume(
    kind: OneTimeTokenKind,
    tokenHash: string,
    executor: DatabaseExecutor,
  ): Promise<string | null>;
}
