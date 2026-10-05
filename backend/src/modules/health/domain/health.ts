export type DependencyStatus = 'up' | 'down';

export interface HealthStatus {
  readonly status: 'ok' | 'degraded';
  readonly timestamp: string;
  readonly dependencies?: Readonly<Record<string, DependencyStatus>>;
}
