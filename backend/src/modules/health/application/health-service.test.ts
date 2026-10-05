import { describe, expect, it } from 'vitest';

import { HealthService } from './health-service.js';

describe('HealthService', () => {
  it('does not use dependencies for liveness', () => {
    const service = new HealthService([{ name: 'database', check: () => Promise.resolve(false) }]);
    expect(service.liveness().status).toBe('ok');
  });

  it('marks readiness degraded when a dependency is unavailable', async () => {
    const service = new HealthService([
      { name: 'database', check: () => Promise.resolve(true) },
      { name: 'redis', check: () => Promise.resolve(false) },
    ]);
    await expect(service.readiness()).resolves.toMatchObject({
      status: 'degraded',
      dependencies: { database: 'up', redis: 'down' },
    });
  });
});
