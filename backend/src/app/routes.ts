import { Router } from 'express';

import type { AppConfig } from '../config/env.js';
import type { TransactionManager } from '../database/transaction-manager.js';
import { createAuthRouter, type AuthService } from '../modules/auth/index.js';
import { createHealthRouter, type HealthService } from '../modules/health/index.js';
import { createSessionRouter } from '../modules/sessions/index.js';
import { createUserRouter, type UserService } from '../modules/users/index.js';
import { createFileRouter, type FileService } from '../modules/files/index.js';
import {
  createNotificationRouter,
  type NotificationService,
} from '../modules/notifications/index.js';
import { createAuditLogRouter, type AuditLogService } from '../modules/audit-logs/index.js';
import type { RoleRepository } from '../modules/roles/index.js';
import type { TokenService } from '../shared/infrastructure/token-service.js';
import type { MetricsService } from '../shared/infrastructure/metrics.js';
import type { CsrfService } from '../shared/infrastructure/csrf.js';
import type { Redis } from 'ioredis';
import { createOpenApiDocument } from '../shared/presentation/openapi.js';
import swaggerUi from 'swagger-ui-express';

export interface RouteDependencies {
  readonly healthService: HealthService;
  readonly authService: AuthService;
  readonly tokenService: TokenService;
  readonly csrfService: CsrfService;
  readonly userService: UserService;
  readonly fileService: FileService;
  readonly notificationService: NotificationService;
  readonly auditLogService: AuditLogService;
  readonly roles: RoleRepository;
  readonly transactions: TransactionManager;
  readonly metrics: MetricsService;
  readonly redis: Redis;
}

export function createRouter(config: AppConfig, dependencies: RouteDependencies): Router {
  const router = Router();
  router.use('/health', createHealthRouter(dependencies.healthService));
  router.use(
    `${config.apiBasePath}/auth`,
    createAuthRouter(
      config,
      dependencies.authService,
      dependencies.tokenService,
      dependencies.csrfService,
    ),
  );
  router.use(
    `${config.apiBasePath}/users`,
    createUserRouter(
      dependencies.userService,
      dependencies.authService,
      dependencies.tokenService,
      dependencies.transactions,
    ),
  );
  router.use(
    `${config.apiBasePath}/sessions`,
    createSessionRouter(dependencies.authService, dependencies.tokenService),
  );
  router.use(
    `${config.apiBasePath}/files`,
    createFileRouter(dependencies.fileService, dependencies.tokenService),
  );
  router.use(
    `${config.apiBasePath}/notifications`,
    createNotificationRouter(dependencies.notificationService, dependencies.tokenService),
  );
  router.use(
    `${config.apiBasePath}/audit-logs`,
    createAuditLogRouter(
      dependencies.auditLogService,
      dependencies.tokenService,
      dependencies.roles,
    ),
  );
  router.get('/metrics', async (request, response, next) => {
    try {
      if (
        config.isProduction &&
        (!config.METRICS_TOKEN ||
          request.header('authorization') !== `Bearer ${config.METRICS_TOKEN}`)
      ) {
        response.status(404).end();
        return;
      }
      response.setHeader('content-type', dependencies.metrics.registry.contentType);
      response.end(await dependencies.metrics.render());
    } catch (error) {
      next(error);
    }
  });
  if (config.DOCS_ENABLED && !config.isProduction) {
    const document = createOpenApiDocument(config.APP_NAME, '1.0.0', config.APP_URL);
    router.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
    router.get('/openapi.json', (_request, response) => response.json(document));
  }
  router.get(`${config.apiBasePath}/version`, (_request, response) => {
    response.json({ success: true, data: { name: config.APP_NAME, version: 'v1' }, meta: {} });
  });
  return router;
}
