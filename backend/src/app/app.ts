import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { pinoHttp } from 'pino-http';

import type { AppConfig } from '../config/env.js';
import type { Logger } from 'pino';
import {
  errorMiddleware,
  notFoundMiddleware,
  requestContextMiddleware,
} from '../shared/presentation/middleware.js';
import { createRouter, type RouteDependencies } from './routes.js';
import type { MetricsService } from '../shared/infrastructure/metrics.js';
import { createWebhookRouter } from '../shared/presentation/webhook-routes.js';

export function createApp(
  config: AppConfig,
  logger: Logger,
  dependencies: RouteDependencies,
  metrics: MetricsService,
): Express {
  const app = express();
  app.disable('x-powered-by');
  if (config.TRUST_PROXY) app.set('trust proxy', 1);
  app.use(requestContextMiddleware());
  app.use(
    pinoHttp({
      logger,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      customLogLevel: (_request, response, error) => {
        if (error || response.statusCode >= 500) return 'error';
        if (response.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || config.corsOrigins.includes(origin)) callback(null, true);
        else callback(new Error('CORS origin is not allowed'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(hpp());
  app.use(
    `${config.apiBasePath}/webhooks`,
    express.raw({ type: 'application/json', limit: '1mb' }),
    createWebhookRouter(config, dependencies.redis),
  );
  app.use(express.raw({ type: 'application/octet-stream', limit: config.MAX_UPLOAD_BYTES }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use(metrics.middleware());
  app.use(createRouter(config, dependencies));
  app.use(notFoundMiddleware());
  app.use(errorMiddleware(config, logger));
  return app;
}
