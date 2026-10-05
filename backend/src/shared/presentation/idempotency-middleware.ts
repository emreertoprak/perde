import { createHash } from 'node:crypto';

import type { RequestHandler } from 'express';
import type { Redis } from 'ioredis';

import { ConflictError } from '../domain/app-error.js';

interface CachedResponse {
  readonly requestHash: string;
  readonly statusCode: number;
  readonly body: unknown;
}

export function idempotencyMiddleware(
  redis: Redis,
  prefix: string,
  ttlSeconds = 86_400,
): RequestHandler {
  return async (request, response, next) => {
    try {
      const key = request.header('idempotency-key');
      if (!key) return next();
      if (!/^[A-Za-z0-9_-]{16,255}$/.test(key))
        throw new ConflictError('IDEMPOTENCY_KEY_INVALID', 'Invalid Idempotency-Key');
      const scope = `${request.auth?.userId ?? request.ip}:${request.method}:${request.path}`;
      const redisKey = `${prefix}:idempotency:${createHash('sha256').update(`${scope}:${key}`).digest('hex')}`;
      const requestHash = createHash('sha256')
        .update(JSON.stringify(request.body ?? null))
        .digest('hex');
      const existing = await redis.get(redisKey);
      if (existing) {
        const cached = JSON.parse(existing) as CachedResponse;
        if (cached.requestHash !== requestHash)
          throw new ConflictError(
            'IDEMPOTENCY_KEY_REUSED',
            'Idempotency key was used with a different request',
          );
        response.status(cached.statusCode).json(cached.body);
        return;
      }
      const reservation = await redis.set(
        redisKey,
        JSON.stringify({
          requestHash,
          statusCode: 409,
          body: {
            success: false,
            error: {
              code: 'IDEMPOTENCY_IN_PROGRESS',
              message: 'Request is already processing',
              details: null,
              requestId: null,
            },
          },
        }),
        'EX',
        ttlSeconds,
        'NX',
      );
      if (!reservation)
        throw new ConflictError('IDEMPOTENCY_IN_PROGRESS', 'Request is already processing');
      const originalJson = response.json.bind(response);
      response.json = ((body: unknown) => {
        void redis.set(
          redisKey,
          JSON.stringify({ requestHash, statusCode: response.statusCode, body }),
          'EX',
          ttlSeconds,
        );
        return originalJson(body);
      }) as typeof response.json;
      next();
    } catch (error) {
      next(error);
    }
  };
}
