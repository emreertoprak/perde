import { PostHog } from 'posthog-node';

import type { AppConfig } from '../../config/env.js';
import type { Logger } from 'pino';

export class AnalyticsService {
  private readonly client: PostHog | null;

  public constructor(
    config: AppConfig,
    private readonly logger: Logger,
  ) {
    this.client = config.POSTHOG_API_KEY
      ? new PostHog(config.POSTHOG_API_KEY, { host: config.POSTHOG_HOST })
      : null;
  }

  public capture(
    distinctId: string,
    event: string,
    properties: Record<string, unknown>,
    optedOut: boolean,
  ): Promise<void> {
    if (!this.client || optedOut) return Promise.resolve();
    try {
      this.client.capture({ distinctId, event, properties });
      return Promise.resolve();
    } catch (error) {
      this.logger.warn({ err: error, event }, 'PostHog capture failed');
      return Promise.resolve();
    }
  }

  public async shutdown(): Promise<void> {
    if (this.client) await this.client.shutdown();
  }
}
