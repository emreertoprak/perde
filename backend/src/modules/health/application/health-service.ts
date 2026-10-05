import type { HealthStatus } from '../domain/health.js';

export interface ReadinessProbe {
  readonly name: string;
  check(): Promise<boolean>;
}

export class HealthService {
  public constructor(private readonly readinessProbes: readonly ReadinessProbe[]) {}

  public liveness(): HealthStatus {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  public async readiness(): Promise<HealthStatus> {
    const outcomes = await Promise.all(
      this.readinessProbes.map(
        async (probe) => [probe.name, (await probe.check()) ? 'up' : 'down'] as const,
      ),
    );
    const dependencies = Object.fromEntries(outcomes);
    return {
      status: outcomes.every(([, status]) => status === 'up') ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies,
    };
  }
}
