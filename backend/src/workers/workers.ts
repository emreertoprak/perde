import { UnrecoverableError, Worker } from 'bullmq';
import { sql } from 'drizzle-orm';
import type { Redis } from 'ioredis';
import type { Logger } from 'pino';

import type { AppConfig } from '../config/env.js';
import type { DatabaseExecutor } from '../database/client.js';
import type { QueueSet } from '../jobs/queue-service.js';
import type { MailMessage, MailService } from '../shared/infrastructure/mail-service.js';
import type { AuditLogInput, AuditLogRepository } from '../modules/audit-logs/index.js';
import type { AnalyticsService } from '../shared/infrastructure/analytics.js';

export interface WorkerSet {
  close(): Promise<void>;
}

export function createWorkers(
  config: AppConfig,
  connection: Redis,
  queues: QueueSet,
  mailService: MailService,
  database: DatabaseExecutor,
  auditLogs: AuditLogRepository,
  analytics: AnalyticsService,
  logger: Logger,
): WorkerSet {
  void queues;
  const mailWorker = new Worker<MailMessage>(
    'mail',
    async (job) => {
      try {
        await mailService.send(job.data);
      } catch (error) {
        if (error instanceof Error && /invalid|unsupported/i.test(error.message))
          throw new UnrecoverableError(error.message);
        throw error;
      }
    },
    { connection, prefix: config.REDIS_PREFIX, concurrency: 5 },
  );
  const auditWorker = new Worker<{ audit: AuditLogInput }>(
    'audit',
    async (job) => auditLogs.append(job.data.audit, database),
    { connection: connection.duplicate(), prefix: config.REDIS_PREFIX, concurrency: 5 },
  );
  const analyticsWorker = new Worker<{
    distinctId: string;
    event: string;
    properties: Record<string, unknown>;
    optedOut: boolean;
  }>(
    'analytics',
    async (job) =>
      analytics.capture(
        job.data.distinctId,
        job.data.event,
        job.data.properties,
        job.data.optedOut,
      ),
    { connection: connection.duplicate(), prefix: config.REDIS_PREFIX, concurrency: 5 },
  );
  const maintenanceWorker = new Worker<{ readonly task: 'session_cleanup' | 'token_cleanup' }>(
    'maintenance',
    async (job) => {
      if (job.data.task === 'session_cleanup') {
        await database.execute(
          sql`delete from sessions where expires_at < now() - interval '30 days'`,
        );
      } else {
        await database.execute(
          sql`delete from email_verification_tokens where expires_at < now() - interval '30 days'; delete from password_reset_tokens where expires_at < now() - interval '30 days'`,
        );
      }
      logger.info({ task: job.data.task, jobId: job.id }, 'Maintenance job completed');
    },
    { connection: connection.duplicate(), prefix: config.REDIS_PREFIX, concurrency: 1 },
  );
  for (const worker of [mailWorker, auditWorker, analyticsWorker, maintenanceWorker]) {
    worker.on('error', (error) => logger.error({ err: error }, 'Queue worker error'));
  }
  return {
    async close(): Promise<void> {
      await Promise.all([
        mailWorker.close(),
        auditWorker.close(),
        analyticsWorker.close(),
        maintenanceWorker.close(),
      ]);
    },
  };
}
