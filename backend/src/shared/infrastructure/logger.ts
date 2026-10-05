import pino from 'pino';

import type { AppConfig } from '../../config/env.js';
import { requestContext } from '../application/request-context.js';

const redactedPaths = [
  'password',
  'passwordConfirmation',
  'accessToken',
  'refreshToken',
  'csrfToken',
  'authorization',
  'cookie',
  'clientSecret',
  'privateKey',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers.x-csrf-token',
];

export function createLogger(config: AppConfig): pino.Logger {
  const options: pino.LoggerOptions = {
    level: config.isProduction ? 'info' : 'debug',
    redact: { paths: redactedPaths, censor: '[REDACTED]' },
    mixin: () => {
      const context = requestContext.get();
      return context
        ? {
            requestId: context.requestId,
            correlationId: context.correlationId,
            userId: context.userId,
          }
        : {};
    },
  };
  if (!config.isProduction) {
    options.transport = { target: 'pino-pretty', options: { colorize: true } };
  }
  return pino(options);
}
