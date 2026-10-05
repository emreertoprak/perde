import { Router } from 'express';

import type { HealthService } from '../application/health-service.js';
import { sendSuccess } from '../../../shared/presentation/response.js';

export function createHealthRouter(healthService: HealthService): Router {
  const router = Router();
  router.get('/', (_request, response) => sendSuccess(response, 200, healthService.liveness()));
  router.get('/live', (_request, response) => sendSuccess(response, 200, healthService.liveness()));
  router.get('/ready', async (_request, response) => {
    const status = await healthService.readiness();
    sendSuccess(response, status.status === 'ok' ? 200 : 503, status);
  });
  return router;
}
