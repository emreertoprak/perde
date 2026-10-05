import { createHmac, timingSafeEqual } from 'node:crypto';

import { Router } from 'express';
import { z } from 'zod';

import type { AppConfig } from '../../config/env.js';
import { ConflictError, ValidationError } from '../domain/app-error.js';
import type { Redis } from 'ioredis';
import { sendSuccess } from './response.js';

const paramsSchema = z.object({ provider: z.string().regex(/^[a-z0-9_-]{2,100}$/) });

export function createWebhookRouter(config: AppConfig, redis: Redis): Router {
  const router = Router();
  router.post('/:provider', async (request, response, next) => {
    try {
      const { provider } = paramsSchema.parse(request.params);
      if (!Buffer.isBuffer(request.body))
        throw new ValidationError('Webhook body must be raw bytes');
      const timestamp = request.header('x-webhook-timestamp');
      const signature = request.header('x-webhook-signature');
      const eventId = request.header('x-webhook-id');
      if (!timestamp || !signature || !eventId)
        throw new ValidationError('Webhook signature headers are required');
      const timestampSeconds = Number(timestamp);
      if (
        !Number.isSafeInteger(timestampSeconds) ||
        Math.abs(Date.now() / 1_000 - timestampSeconds) > config.WEBHOOK_TOLERANCE_SECONDS
      ) {
        throw new ValidationError('Webhook timestamp is outside the accepted window');
      }
      const expected = createHmac('sha256', config.WEBHOOK_HMAC_SECRET)
        .update(`${timestamp}.${request.body.toString('utf8')}`)
        .digest('hex');
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expected, 'hex');
      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
        throw new ValidationError('Webhook signature is invalid');
      }
      const replayKey = `${config.REDIS_PREFIX}:webhook:${provider}:${eventId}`;
      if (
        (await redis.set(replayKey, '1', 'EX', config.WEBHOOK_TOLERANCE_SECONDS, 'NX')) !== 'OK'
      ) {
        throw new ConflictError('WEBHOOK_REPLAYED', 'Webhook event was already received');
      }
      sendSuccess(response, 202, { accepted: true });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
