import { describe, expect, it } from 'vitest';

import { testEnv } from '../../tests/helpers/test-env.js';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('normalizes client origins and signing key rings', () => {
    const config = loadEnv(
      testEnv({
        CORS_ORIGINS: 'http://localhost:5173, https://app.example.test ',
        JWT_ACCESS_PREVIOUS_SECRETS:
          'previous-access-secret-that-is-longer-than-thirty-two,another-access-secret-that-is-longer-than-thirty-two',
      }),
    );

    expect(config.corsOrigins).toEqual(['http://localhost:5173', 'https://app.example.test']);
    expect(config.jwtAccessVerificationSecrets).toHaveLength(3);
    expect(config.apiBasePath).toBe('/api/v1');
  });

  it('rejects enabled OAuth without its credentials', () => {
    expect(() => loadEnv(testEnv({ GOOGLE_LOGIN_ENABLED: 'true' }))).toThrow(
      'Google OAuth requires',
    );
  });
});
