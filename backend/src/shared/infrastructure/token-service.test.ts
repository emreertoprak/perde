import { describe, expect, it } from 'vitest';

import { loadEnv } from '../../config/env.js';
import { testEnv } from '../../../tests/helpers/test-env.js';
import { TokenService } from './token-service.js';

describe('TokenService', () => {
  it('issues and verifies an access token with minimal claims', async () => {
    const service = new TokenService(loadEnv(testEnv()));
    const token = await service.issueAccess({
      userId: 'user-1',
      sessionId: 'session-1',
      sessionFamilyId: 'family-1',
    });
    await expect(service.verifyAccess(token)).resolves.toEqual({
      userId: 'user-1',
      sessionId: 'session-1',
      sessionFamilyId: 'family-1',
      kind: 'access',
    });
  });

  it('does not accept a refresh token as an access token', async () => {
    const service = new TokenService(loadEnv(testEnv()));
    const refresh = await service.issueRefresh({
      userId: 'user-1',
      sessionId: 'session-1',
      sessionFamilyId: 'family-1',
    });
    await expect(service.verifyAccess(refresh)).rejects.toMatchObject({
      code: 'AUTH_INVALID_TOKEN',
    });
  });
});
