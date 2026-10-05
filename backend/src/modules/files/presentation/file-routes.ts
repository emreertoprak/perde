import { Router } from 'express';
import { z } from 'zod';

import type { TokenService } from '../../../shared/infrastructure/token-service.js';
import { ValidationError } from '../../../shared/domain/app-error.js';
import { requireAuth } from '../../../shared/presentation/auth-middleware.js';
import { validate } from '../../../shared/presentation/middleware.js';
import { sendSuccess } from '../../../shared/presentation/response.js';
import type { FileService } from '../application/file-service.js';

const fileParam = z.object({ fileId: z.uuid() });

export function createFileRouter(files: FileService, tokens: TokenService): Router {
  const router = Router();
  router.use(requireAuth(tokens));
  router.post('/upload', async (request, response, next) => {
    try {
      if (!Buffer.isBuffer(request.body)) throw new ValidationError('Expected raw upload body');
      const originalName = request.header('x-file-name');
      const visibility = request.header('x-file-visibility') === 'public' ? 'public' : 'private';
      if (!originalName || !request.is('application/octet-stream'))
        throw new ValidationError('Upload headers are invalid');
      const record = await files.upload(request.auth?.userId ?? '', {
        originalName,
        contentType: request.header('x-file-content-type') ?? 'application/octet-stream',
        visibility,
        body: request.body,
      });
      sendSuccess(response, 201, record);
    } catch (error) {
      next(error);
    }
  });
  router.get('/:fileId', validate(fileParam, 'params'), async (request, response, next) => {
    try {
      const fileId = String(request.params.fileId);
      const { record, body } = await files.download(request.auth?.userId ?? '', fileId);
      response.setHeader('content-type', record.mimeType);
      response.setHeader(
        'content-disposition',
        `attachment; filename="${record.originalName.replace(/"/g, '')}"`,
      );
      response.send(body);
    } catch (error) {
      next(error);
    }
  });
  router.get(
    '/:fileId/presigned-url',
    validate(fileParam, 'params'),
    async (request, response, next) => {
      try {
        sendSuccess(response, 200, {
          url: await files.presign(request.auth?.userId ?? '', String(request.params.fileId)),
        });
      } catch (error) {
        next(error);
      }
    },
  );
  router.delete('/:fileId', validate(fileParam, 'params'), async (request, response, next) => {
    try {
      await files.delete(request.auth?.userId ?? '', String(request.params.fileId));
      sendSuccess(response, 200, { deleted: true });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
