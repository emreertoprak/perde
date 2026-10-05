import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { z } from 'zod';

import type { AppConfig } from '../../config/env.js';
import { requestContext } from '../application/request-context.js';
import { AppError, ValidationError } from '../domain/app-error.js';
import type { Logger } from 'pino';
import { v7 as uuidv7 } from 'uuid';

import { sendError } from './response.js';

const requestIdPattern = /^[A-Za-z0-9_-]{8,128}$/;

export function requestContextMiddleware(): RequestHandler {
  return (request, response, next) => {
    const requestIdHeader = request.header('x-request-id');
    const correlationIdHeader = request.header('x-correlation-id');
    const context = {
      requestId:
        requestIdHeader && requestIdPattern.test(requestIdHeader) ? requestIdHeader : uuidv7(),
      correlationId:
        correlationIdHeader && requestIdPattern.test(correlationIdHeader)
          ? correlationIdHeader
          : uuidv7(),
      ipAddress: request.ip ?? request.socket.remoteAddress ?? 'unknown',
      userAgent: request.header('user-agent'),
    };
    response.setHeader('x-request-id', context.requestId);
    response.setHeader('x-correlation-id', context.correlationId);
    requestContext.run(context, () => next());
  };
}

export function validate(schema: z.ZodType, source: 'body' | 'params' | 'query'): RequestHandler {
  return (request, _response, next) => {
    const parsed = schema.safeParse(request[source]);
    if (!parsed.success) {
      next(
        new ValidationError(
          'Request validation failed',
          parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
      return;
    }
    Object.assign(request[source], parsed.data);
    next();
  };
}

export function notFoundMiddleware(): RequestHandler {
  return (request, response) => {
    sendError(
      response,
      404,
      'ROUTE_NOT_FOUND',
      `Route ${request.method} ${request.path} was not found`,
    );
  };
}

export function errorMiddleware(config: AppConfig, logger: Logger): ErrorRequestHandler {
  return (error: unknown, request, response, _next) => {
    void _next;
    if (response.headersSent) return;
    if (error instanceof AppError) {
      logger.warn(
        { err: error, path: request.path, method: request.method },
        'Operational request error',
      );
      sendError(response, error.statusCode, error.code, error.message, error.details);
      return;
    }
    logger.error(
      { err: error, path: request.path, method: request.method },
      'Unhandled request error',
    );
    sendError(
      response,
      500,
      'INTERNAL_ERROR',
      config.isProduction
        ? 'An unexpected error occurred'
        : 'An unexpected error occurred; inspect server logs',
    );
  };
}
