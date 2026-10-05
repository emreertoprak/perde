import { decodeProtectedHeader, jwtVerify, SignJWT, type JWTPayload } from 'jose';

import type { AppConfig } from '../../config/env.js';
import { AuthenticationError } from '../domain/app-error.js';
import { sha256 } from './crypto.js';

type TokenKind = 'access' | 'refresh';

export interface AccessTokenClaims {
  readonly userId: string;
  readonly sessionFamilyId: string;
  readonly sessionId: string;
}

export type RefreshTokenClaims = AccessTokenClaims;

interface VerifiedToken extends AccessTokenClaims {
  readonly kind: TokenKind;
}

const encoder = new TextEncoder();

export class TokenService {
  public constructor(private readonly config: AppConfig) {}

  public async issueAccess(claims: AccessTokenClaims): Promise<string> {
    return this.sign(
      'access',
      claims,
      this.config.JWT_ACCESS_SECRET,
      this.config.JWT_ACCESS_EXPIRES_IN_SECONDS,
    );
  }

  public async issueRefresh(claims: RefreshTokenClaims): Promise<string> {
    return this.sign(
      'refresh',
      claims,
      this.config.JWT_REFRESH_SECRET,
      this.config.JWT_REFRESH_EXPIRES_IN_SECONDS,
    );
  }

  public verifyAccess(token: string): Promise<AccessTokenClaims> {
    return this.verify('access', token, this.config.jwtAccessVerificationSecrets);
  }

  public verifyRefresh(token: string): Promise<RefreshTokenClaims> {
    return this.verify('refresh', token, this.config.jwtRefreshVerificationSecrets);
  }

  private async sign(
    kind: TokenKind,
    claims: AccessTokenClaims,
    secret: string,
    expiresInSeconds: number,
  ): Promise<string> {
    return new SignJWT({
      sid: claims.sessionId,
      fid: claims.sessionFamilyId,
      typ: kind,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT', kid: this.keyId(secret) })
      .setIssuer(this.config.JWT_ISSUER)
      .setAudience(this.config.JWT_AUDIENCE)
      .setSubject(claims.userId)
      .setJti(crypto.randomUUID())
      .setIssuedAt()
      .setExpirationTime(`${expiresInSeconds}s`)
      .sign(encoder.encode(secret));
  }

  private async verify(
    kind: TokenKind,
    token: string,
    secrets: readonly string[],
  ): Promise<AccessTokenClaims> {
    for (const secret of this.orderByKeyId(token, secrets)) {
      try {
        const { payload } = await jwtVerify(token, encoder.encode(secret), {
          issuer: this.config.JWT_ISSUER,
          audience: this.config.JWT_AUDIENCE,
        });
        return this.parsePayload(payload, kind);
      } catch {
        // Try a retained previous signing key before returning a generic auth error.
      }
    }
    throw new AuthenticationError('AUTH_INVALID_TOKEN', 'Invalid or expired token');
  }

  private orderByKeyId(token: string, secrets: readonly string[]): readonly string[] {
    let kid: string | undefined;
    try {
      kid = decodeProtectedHeader(token).kid;
    } catch {
      return secrets;
    }
    if (!kid) return secrets;
    return [...secrets].sort((a, b) =>
      Number(this.keyId(b) === kid) - Number(this.keyId(a) === kid),
    );
  }

  private parsePayload(payload: JWTPayload, expectedKind: TokenKind): VerifiedToken {
    if (
      payload.typ !== expectedKind ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string' ||
      typeof payload.fid !== 'string'
    ) {
      throw new AuthenticationError('AUTH_INVALID_TOKEN', 'Invalid token claims');
    }
    return {
      userId: payload.sub,
      sessionId: payload.sid,
      sessionFamilyId: payload.fid,
      kind: expectedKind,
    };
  }

  // Non-reversible key identifier: never embed raw secret material in the JWT header.
  private keyId(secret: string): string {
    return sha256(secret).slice(0, 12);
  }
}
