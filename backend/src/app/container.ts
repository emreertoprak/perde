import type { AppConfig } from '../config/env.js';
import { createDatabase } from '../database/client.js';
import { TransactionManager } from '../database/transaction-manager.js';
import { AuthService, DrizzleOneTimeTokenRepository } from '../modules/auth/index.js';
import { AuditLogService, DrizzleAuditLogRepository } from '../modules/audit-logs/index.js';
import {
  DrizzleFileRepository,
  FileService,
  LocalStorageProvider,
  S3StorageProvider,
} from '../modules/files/index.js';
import { HealthService, StaticReadinessProbe } from '../modules/health/index.js';
import { DrizzleRoleRepository } from '../modules/roles/index.js';
import {
  DrizzleNotificationRepository,
  NotificationService,
} from '../modules/notifications/index.js';
import { DrizzleSessionRepository } from '../modules/sessions/index.js';
import { DrizzleUserRepository, UserService } from '../modules/users/index.js';
import { PasswordService } from '../shared/infrastructure/password-service.js';
import { EncryptionService } from '../shared/infrastructure/crypto.js';
import { createCsrfService } from '../shared/infrastructure/csrf.js';
import { createLogger } from '../shared/infrastructure/logger.js';
import {
  createApiRedis,
  CacheService,
  createQueueProducerRedis,
} from '../shared/infrastructure/redis.js';
import { DrizzleOutboxRepository } from '../shared/infrastructure/persistence/outbox-repository.js';
import { TokenService } from '../shared/infrastructure/token-service.js';
import { createQueues } from '../jobs/queue-service.js';
import { AnalyticsService } from '../shared/infrastructure/analytics.js';
import { MetricsService } from '../shared/infrastructure/metrics.js';

export function createContainer(config: AppConfig) {
  const logger = createLogger(config);
  const metrics = new MetricsService();
  const analytics = new AnalyticsService(config, logger);
  const database = createDatabase(config);
  const redis = createApiRedis(config);
  const queueRedis = createQueueProducerRedis(config);
  const queues = createQueues(queueRedis, config.REDIS_PREFIX);
  const transactions = new TransactionManager(database.db);
  const users = new DrizzleUserRepository(database.db);
  const roles = new DrizzleRoleRepository(database.db);
  const sessions = new DrizzleSessionRepository(database.db);
  const fileRepository = new DrizzleFileRepository(database.db);
  const auditLogs = new DrizzleAuditLogRepository(database.db);
  const storage =
    config.STORAGE_PROVIDER === 's3'
      ? new S3StorageProvider(config)
      : new LocalStorageProvider(config.LOCAL_STORAGE_PATH);
  const tokens = new TokenService(config);
  const encryption = new EncryptionService(config);
  const authService = new AuthService(
    config,
    transactions,
    users,
    roles,
    sessions,
    new DrizzleOneTimeTokenRepository(),
    new PasswordService(),
    tokens,
    new DrizzleOutboxRepository(database.db),
    encryption,
    auditLogs,
  );
  const healthService = new HealthService([
    new StaticReadinessProbe('application', () => Promise.resolve(true)),
    new StaticReadinessProbe('postgres', async () => {
      try {
        await database.sql`select 1`;
        return true;
      } catch (error) {
        logger.warn({ err: error }, 'PostgreSQL readiness check failed');
        return false;
      }
    }),
    new StaticReadinessProbe('redis', async () => {
      try {
        await redis.connect();
      } catch {
        // A connected client rejects connect; ping still determines readiness.
      }
      try {
        await redis.ping();
        await queues.mail.getJobCounts('waiting', 'active', 'failed');
        return true;
      } catch (error) {
        logger.warn({ err: error }, 'Redis or queue readiness check failed');
        return false;
      }
    }),
  ]);
  return {
    logger,
    healthService,
    authService,
    tokenService: tokens,
    csrfService: createCsrfService(config),
    userService: new UserService(users),
    fileService: new FileService(transactions, fileRepository, storage, config.STORAGE_PROVIDER),
    notificationService: new NotificationService(
      new DrizzleNotificationRepository(database.db),
      transactions,
    ),
    auditLogService: new AuditLogService(auditLogs),
    transactions,
    roles,
    cache: new CacheService(redis, config.REDIS_PREFIX),
    redis,
    metrics,
    analytics,
    close: async () => {
      await queues.close();
      await analytics.shutdown();
      await redis.quit();
      await queueRedis.quit();
      await database.sql.end({ timeout: 10 });
    },
  };
}
