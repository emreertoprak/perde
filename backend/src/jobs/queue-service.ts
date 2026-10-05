import { Queue, type JobsOptions } from 'bullmq';

import type { Redis } from 'ioredis';

import type { MailMessage } from '../shared/infrastructure/mail-service.js';

export interface QueueSet {
  readonly mail: Queue<MailMessage, void, string, MailMessage, void, string>;
  readonly audit: Queue<
    Record<string, unknown>,
    void,
    string,
    Record<string, unknown>,
    void,
    string
  >;
  readonly analytics: Queue<
    Record<string, unknown>,
    void,
    string,
    Record<string, unknown>,
    void,
    string
  >;
  readonly maintenance: Queue<
    Record<string, unknown>,
    void,
    string,
    Record<string, unknown>,
    void,
    string
  >;
  close(): Promise<void>;
}

const defaults: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: { age: 86_400, count: 1_000 },
  removeOnFail: { age: 604_800, count: 5_000 },
};

export function createQueues(connection: Redis, prefix: string): QueueSet {
  const options = { connection, prefix, defaultJobOptions: defaults };
  const mail = new Queue<MailMessage, void, string, MailMessage, void, string>('mail', options);
  const audit = new Queue<
    Record<string, unknown>,
    void,
    string,
    Record<string, unknown>,
    void,
    string
  >('audit', options);
  const analytics = new Queue<
    Record<string, unknown>,
    void,
    string,
    Record<string, unknown>,
    void,
    string
  >('analytics', options);
  const maintenance = new Queue<
    Record<string, unknown>,
    void,
    string,
    Record<string, unknown>,
    void,
    string
  >('maintenance', options);
  return {
    mail,
    audit,
    analytics,
    maintenance,
    async close(): Promise<void> {
      await Promise.all([mail.close(), audit.close(), analytics.close(), maintenance.close()]);
    },
  };
}
