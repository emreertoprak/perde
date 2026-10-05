import { createHmac, randomBytes } from 'node:crypto';

import type { AppConfig } from '../../config/env.js';
import { safeEqual } from './crypto.js';

export class CsrfService {
  public constructor(private readonly secret: string) {}

  public issue(refreshToken: string): string {
    const nonce = randomBytes(24).toString('base64url');
    return `${nonce}.${this.signature(refreshToken, nonce)}`;
  }

  public verify(refreshToken: string, token: string): boolean {
    const [nonce, signature, extra] = token.split('.');
    if (!nonce || !signature || extra) return false;
    return safeEqual(signature, this.signature(refreshToken, nonce));
  }

  private signature(refreshToken: string, nonce: string): string {
    return createHmac('sha256', this.secret).update(`${refreshToken}.${nonce}`).digest('base64url');
  }
}

export function createCsrfService(config: Pick<AppConfig, 'CSRF_SECRET'>): CsrfService {
  return new CsrfService(config.CSRF_SECRET);
}
