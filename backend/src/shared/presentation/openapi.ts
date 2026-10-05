import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();
const success = z
  .object({
    success: z.literal(true),
    data: z.unknown(),
    meta: z.object({ requestId: z.string().nullable() }),
  })
  .openapi('SuccessResponse');
const failure = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().nullable(),
      requestId: z.string().nullable(),
    }),
  })
  .openapi('ErrorResponse');

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});
registry.register('SuccessResponse', success);
registry.register('ErrorResponse', failure);
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Authentication'],
  summary: 'Sign in with e-mail and password',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.email(),
            password: z.string(),
            clientType: z.enum(['web', 'mobile']),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Authenticated', content: { 'application/json': { schema: success } } },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: failure } },
    },
  },
});
registry.registerPath({
  method: 'get',
  path: '/health/ready',
  tags: ['Health'],
  summary: 'Check PostgreSQL, Redis, and queue readiness',
  responses: { 200: { description: 'Ready' }, 503: { description: 'Dependency unavailable' } },
});

export function createOpenApiDocument(title: string, version: string, serverUrl: string) {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: { title, version, description: 'Production-ready backend starter kit API' },
    servers: [{ url: serverUrl }],
  });
}
