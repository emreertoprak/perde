import { v7 as uuidv7 } from 'uuid';

import type { AppConfig } from '../../../config/env.js';
import type { DatabaseTransaction } from '../../../database/client.js';
import type { TransactionManager } from '../../../database/transaction-manager.js';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../../../shared/domain/app-error.js';
import { generateSecureToken, sha256 } from '../../../shared/infrastructure/crypto.js';
import type { EncryptionService } from '../../../shared/infrastructure/crypto.js';
import type { PasswordService } from '../../../shared/infrastructure/password-service.js';
import type { TokenService } from '../../../shared/infrastructure/token-service.js';
import type { OutboxRepository } from '../../../shared/application/outbox-repository.js';
import type { AuditLogRepository } from '../../audit-logs/index.js';
import type { RoleRepository } from '../../roles/index.js';
import type { SessionDeviceInput, SessionRepository } from '../../sessions/index.js';
import type { User, UserRepository } from '../../users/index.js';
import type { OneTimeTokenRepository } from './auth-token-repository.js';

export interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly firstName?: string | undefined;
  readonly lastName?: string | undefined;
  readonly displayName?: string | undefined;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
  readonly device: SessionDeviceInput;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessTokenExpiresIn: number;
  readonly refreshTokenExpiresIn: number;
}

export interface OneTimeTokenResult {
  readonly userId: string;
  readonly token: string;
}

export class AuthService {
  public constructor(
    private readonly config: AppConfig,
    private readonly transactions: TransactionManager,
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
    private readonly sessions: SessionRepository,
    private readonly oneTimeTokens: OneTimeTokenRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly outbox: OutboxRepository,
    private readonly encryption: EncryptionService,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async register(
    input: RegisterInput,
  ): Promise<{ readonly user: User; readonly verification: OneTimeTokenResult }> {
    const normalizedEmail = normalizeEmail(input.email);
    const passwordHash = await this.passwords.hash(input.password);
    return this.transactions.withinTransaction(async (transaction) => {
      const existing = await this.users.findByNormalizedEmail(normalizedEmail, transaction);
      if (existing)
        throw new ConflictError('AUTH_EMAIL_IN_USE', 'An account with this e-mail already exists');
      const user = await this.users.create(
        {
          email: input.email.trim(),
          normalizedEmail,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: input.displayName,
        },
        transaction,
      );
      await this.roles.assignRoleBySlug(user.id, 'user', transaction);
      const verification = await this.createOneTimeToken(
        'email-verification',
        user.id,
        86_400,
        transaction,
      );
      await this.enqueueActionMail('email-verification', user, verification.token, transaction);
      await this.auditLogs.append(
        { actorUserId: user.id, action: 'user.registered', entityType: 'user', entityId: user.id },
        transaction,
      );
      return { user, verification };
    });
  }

  public async login(input: LoginInput): Promise<AuthTokens> {
    const normalizedEmail = normalizeEmail(input.email);
    const user = await this.users.findByNormalizedEmail(normalizedEmail);
    if (!user?.passwordHash) this.passwords.invalidCredentials();
    if (user.status !== 'active')
      throw new AuthenticationError('AUTH_ACCOUNT_INACTIVE', 'This account is unavailable');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError(
        'AUTH_ACCOUNT_LOCKED',
        'Too many failed attempts; try again later',
      );
    }
    if (!(await this.passwords.verify(user.passwordHash, input.password))) {
      const nextFailures = user.failedLoginAttempts + 1;
      const lockUntil = nextFailures >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
      await this.transactions.withinTransaction((transaction) =>
        this.users.markLoginFailure(user.id, lockUntil, transaction),
      );
      this.passwords.invalidCredentials();
    }
    return this.transactions.withinTransaction(async (transaction) => {
      await this.users.markLoginSuccess(user.id, input.device.ipAddress, transaction);
      const issued = await this.issueSessionTokens(user.id, input.device, transaction);
      await this.auditLogs.append(
        {
          actorUserId: user.id,
          action: 'user.logged_in',
          entityType: 'session',
          entityId: (await this.tokens.verifyRefresh(issued.refreshToken)).sessionId,
          ipAddress: input.device.ipAddress,
          userAgent: input.device.userAgent,
        },
        transaction,
      );
      return issued;
    });
  }

  public async refresh(refreshToken: string, device: SessionDeviceInput): Promise<AuthTokens> {
    const claims = await this.tokens.verifyRefresh(refreshToken);
    return this.transactions.withinTransaction(async (transaction) => {
      const current = await this.sessions.findByIdForUpdate(claims.sessionId, transaction);
      if (
        current?.userId !== claims.userId ||
        current.tokenFamilyId !== claims.sessionFamilyId ||
        current.refreshTokenHash !== sha256(refreshToken) ||
        current.expiresAt <= new Date() ||
        current.revokedAt !== null
      ) {
        await this.sessions.revokeFamily(
          claims.userId,
          claims.sessionFamilyId,
          'refresh_token_reuse',
          transaction,
        );
        await this.auditLogs.append(
          {
            actorUserId: claims.userId,
            action: 'auth.refresh_reuse_detected',
            entityType: 'session_family',
            entityId: claims.sessionFamilyId,
          },
          transaction,
        );
        throw new AuthenticationError('AUTH_REFRESH_REUSED', 'Refresh token is invalid');
      }
      const tokens = await this.issueSessionTokens(
        claims.userId,
        device,
        transaction,
        claims.sessionFamilyId,
      );
      const refreshed = await this.tokens.verifyRefresh(tokens.refreshToken);
      await this.sessions.revoke(current.id, 'rotated', refreshed.sessionId, transaction);
      return tokens;
    });
  }

  public async logout(refreshToken: string): Promise<void> {
    const claims = await this.tokens.verifyRefresh(refreshToken);
    await this.transactions.withinTransaction(async (transaction) => {
      await this.sessions.revoke(claims.sessionId, 'user_logout', null, transaction);
      await this.auditLogs.append(
        {
          actorUserId: claims.userId,
          action: 'user.logged_out',
          entityType: 'session',
          entityId: claims.sessionId,
        },
        transaction,
      );
    });
  }

  public async logoutAll(userId: string): Promise<void> {
    await this.transactions.withinTransaction((transaction) =>
      this.sessions.revokeAllForUser(userId, 'logout_all', transaction),
    );
  }

  public async deactivateAccount(userId: string): Promise<void> {
    await this.transactions.withinTransaction(async (transaction) => {
      await this.users.setStatus(userId, 'inactive', transaction);
      await this.sessions.revokeAllForUser(userId, 'account_deactivated', transaction);
      await this.auditLogs.append(
        { actorUserId: userId, action: 'user.deactivated', entityType: 'user', entityId: userId },
        transaction,
      );
    });
  }

  public async deleteAccount(userId: string): Promise<void> {
    await this.transactions.withinTransaction(async (transaction) => {
      await this.sessions.revokeAllForUser(userId, 'account_deleted', transaction);
      await this.users.anonymize(userId, `deleted-${userId}@deleted.invalid`, transaction);
      await this.auditLogs.append(
        { actorUserId: userId, action: 'user.deleted', entityType: 'user', entityId: userId },
        transaction,
      );
    });
  }

  public async listSessions(userId: string) {
    return this.sessions.listActiveByUser(userId);
  }

  public async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.transactions.withinTransaction(async (transaction) => {
      const session = await this.sessions.findById(sessionId, transaction);
      if (session?.userId !== userId)
        throw new NotFoundError('SESSION_NOT_FOUND', 'Session not found');
      await this.sessions.revoke(session.id, 'user_revoked', null, transaction);
    });
  }

  public async requestPasswordReset(email: string): Promise<OneTimeTokenResult | null> {
    const user = await this.users.findByNormalizedEmail(normalizeEmail(email));
    if (user?.status !== 'active') return null;
    return this.transactions.withinTransaction(async (transaction) => {
      const reset = await this.createOneTimeToken('password-reset', user.id, 1_800, transaction);
      await this.enqueueActionMail('password-reset', user, reset.token, transaction);
      return reset;
    });
  }

  public async resetPassword(token: string, password: string): Promise<void> {
    const passwordHash = await this.passwords.hash(password);
    await this.transactions.withinTransaction(async (transaction) => {
      const userId = await this.oneTimeTokens.consume('password-reset', sha256(token), transaction);
      if (!userId)
        throw new AuthenticationError(
          'AUTH_RESET_TOKEN_INVALID',
          'Password reset token is invalid or expired',
        );
      await this.users.updatePassword(userId, passwordHash, transaction);
      await this.sessions.revokeAllForUser(userId, 'password_reset', transaction);
      await this.auditLogs.append(
        {
          actorUserId: userId,
          action: 'password.reset_completed',
          entityType: 'user',
          entityId: userId,
        },
        transaction,
      );
    });
  }

  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.users.findById(userId);
    const existingHash = user?.passwordHash;
    if (!existingHash || !(await this.passwords.verify(existingHash, currentPassword))) {
      this.passwords.invalidCredentials();
    }
    const passwordHash = await this.passwords.hash(newPassword);
    await this.transactions.withinTransaction(async (transaction) => {
      await this.users.updatePassword(userId, passwordHash, transaction);
      await this.sessions.revokeAllForUser(userId, 'password_changed', transaction);
      await this.auditLogs.append(
        { actorUserId: userId, action: 'password.changed', entityType: 'user', entityId: userId },
        transaction,
      );
    });
  }

  public async verifyEmail(token: string): Promise<void> {
    await this.transactions.withinTransaction(async (transaction) => {
      const userId = await this.oneTimeTokens.consume(
        'email-verification',
        sha256(token),
        transaction,
      );
      if (!userId)
        throw new AuthenticationError(
          'AUTH_VERIFICATION_TOKEN_INVALID',
          'Verification token is invalid or expired',
        );
      await this.users.setEmailVerified(userId, transaction);
      await this.auditLogs.append(
        { actorUserId: userId, action: 'email.verified', entityType: 'user', entityId: userId },
        transaction,
      );
    });
  }

  public async requestEmailVerification(userId: string): Promise<OneTimeTokenResult> {
    return this.transactions.withinTransaction(async (transaction) => {
      const user = await this.users.findById(userId, transaction);
      if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
      const verification = await this.createOneTimeToken(
        'email-verification',
        userId,
        86_400,
        transaction,
      );
      await this.enqueueActionMail('email-verification', user, verification.token, transaction);
      return verification;
    });
  }

  private async issueSessionTokens(
    userId: string,
    device: SessionDeviceInput,
    transaction: DatabaseTransaction,
    existingFamilyId?: string,
  ): Promise<AuthTokens> {
    const sessionId = uuidv7();
    const sessionFamilyId = existingFamilyId ?? uuidv7();
    const placeholderRefreshHash = sha256(`${sessionId}:pending`);
    const expiresAt = new Date(Date.now() + this.config.JWT_REFRESH_EXPIRES_IN_SECONDS * 1_000);
    await this.sessions.create(
      {
        id: sessionId,
        userId,
        tokenFamilyId: sessionFamilyId,
        refreshTokenHash: placeholderRefreshHash,
        expiresAt,
        ...device,
      },
      transaction,
    );
    const refreshToken = await this.tokens.issueRefresh({ userId, sessionId, sessionFamilyId });
    await this.sessions.updateRefreshTokenHash(sessionId, sha256(refreshToken), transaction);
    const accessToken = await this.tokens.issueAccess({ userId, sessionId, sessionFamilyId });
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.config.JWT_ACCESS_EXPIRES_IN_SECONDS,
      refreshTokenExpiresIn: this.config.JWT_REFRESH_EXPIRES_IN_SECONDS,
    };
  }

  private async createOneTimeToken(
    kind: 'email-verification' | 'password-reset',
    userId: string,
    ttlSeconds: number,
    transaction: DatabaseTransaction,
  ): Promise<OneTimeTokenResult> {
    const token = generateSecureToken();
    await this.oneTimeTokens.create(
      kind,
      userId,
      sha256(token),
      new Date(Date.now() + ttlSeconds * 1_000),
      transaction,
    );
    return { userId, token };
  }

  private async enqueueActionMail(
    template: 'email-verification' | 'password-reset',
    user: User,
    token: string,
    transaction: DatabaseTransaction,
  ): Promise<void> {
    const path = template === 'email-verification' ? '/verify-email' : '/reset-password';
    const actionUrl = new URL(path, this.config.WEB_APP_URL);
    actionUrl.searchParams.set('token', token);
    await this.outbox.add(
      {
        aggregateType: 'user',
        aggregateId: user.id,
        eventType: 'mail.send',
        payload: {
          to: user.email,
          template,
          encryptedActionUrl: this.encryption.encrypt(actionUrl.toString()),
        },
        occurredAt: new Date(),
      },
      transaction,
    );
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase('en-US');
}
