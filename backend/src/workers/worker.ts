import { createDatabase } from '../database/client.js';
import { OutboxDispatcher } from '../jobs/outbox-dispatcher.js';
import { createQueues } from '../jobs/queue-service.js';
import { loadEnv } from '../config/env.js';
import { EncryptionService } from '../shared/infrastructure/crypto.js';
import { createLogger } from '../shared/infrastructure/logger.js';
import { MailService } from '../shared/infrastructure/mail-service.js';
import { DrizzleOutboxRepository } from '../shared/infrastructure/persistence/outbox-repository.js';
import { createWorkerRedis } from '../shared/infrastructure/redis.js';
import { createWorkers } from './workers.js';
import { DrizzleAuditLogRepository } from '../modules/audit-logs/index.js';
import { AnalyticsService } from '../shared/infrastructure/analytics.js';

const config = loadEnv();
const logger = createLogger(config);
const database = createDatabase(config);
const redis = createWorkerRedis(config);
const queues = createQueues(redis, config.REDIS_PREFIX);
const analytics = new AnalyticsService(config, logger);
const workers = createWorkers(
  config,
  redis,
  queues,
  new MailService(config),
  database.db,
  new DrizzleAuditLogRepository(database.db),
  analytics,
  logger,
);
const dispatcher = new OutboxDispatcher(
  new DrizzleOutboxRepository(database.db),
  queues,
  new EncryptionService(config),
);

const interval = setInterval(() => {
  void dispatcher
    .dispatch()
    .catch((error: unknown) => logger.error({ err: error }, 'Outbox dispatch failed'));
}, 5_000);
void dispatcher
  .dispatch()
  .catch((error: unknown) => logger.error({ err: error }, 'Initial outbox dispatch failed'));

let shuttingDown = false;
const shutdown = (signal: string): void => {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(interval);
  void (async () => {
    logger.info({ signal }, 'Worker shutdown started');
    try {
      await workers.close();
      await queues.close();
      await analytics.shutdown();
      await redis.quit();
      await database.sql.end({ timeout: 10 });
      logger.info('Worker shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Worker shutdown failed');
      process.exit(1);
    }
  })();
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
