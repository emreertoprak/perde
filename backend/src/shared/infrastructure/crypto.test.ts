import { describe, expect, it } from 'vitest';

import { loadEnv } from '../../config/env.js';
import { testEnv } from '../../../tests/helpers/test-env.js';
import { EncryptionService, generateSecureToken, safeEqual, sha256 } from './crypto.js';

describe('EncryptionService', () => {
  it('round-trips authenticated encrypted values', () => {
    const encryption = new EncryptionService(loadEnv(testEnv()));
    const encrypted = encryption.encrypt('sensitive value');
    expect(encrypted).not.toContain('sensitive value');
    expect(encryption.decrypt(encrypted)).toBe('sensitive value');
  });

  it('compares values in constant-time compatible form', () => {
    expect(safeEqual('same', 'same')).toBe(true);
    expect(safeEqual('same', 'different')).toBe(false);
  });

  it('hashes values, generates opaque tokens, and rejects malformed ciphertext', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(generateSecureToken(24)).toHaveLength(32);
    expect(() => new EncryptionService(loadEnv(testEnv())).decrypt('tiny')).toThrow(
      'Invalid encrypted payload',
    );
  });
});
