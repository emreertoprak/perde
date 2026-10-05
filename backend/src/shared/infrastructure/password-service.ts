import argon2 from 'argon2';

import { AuthenticationError, ValidationError } from '../domain/app-error.js';

const options = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
} as const;

export class PasswordService {
  public async hash(password: string): Promise<string> {
    this.assertPolicy(password);
    return argon2.hash(password, options);
  }

  public async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  public assertPolicy(password: string): void {
    if (password.length < 15 || password.length > 128) {
      throw new ValidationError('Password must be between 15 and 128 characters', [
        { path: 'password', message: 'Use a 15-128 character passphrase' },
      ]);
    }
  }

  public invalidCredentials(): never {
    throw new AuthenticationError('AUTH_INVALID_CREDENTIALS', 'Invalid e-mail address or password');
  }
}
