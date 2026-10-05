import type { ReadinessProbe } from '../application/health-service.js';

export class StaticReadinessProbe implements ReadinessProbe {
  public constructor(
    public readonly name: string,
    private readonly checkFn: () => Promise<boolean>,
  ) {}

  public check(): Promise<boolean> {
    return this.checkFn();
  }
}
