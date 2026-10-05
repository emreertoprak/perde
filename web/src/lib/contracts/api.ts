/**
 * Backend'in (backend-iskelet) yanit zarfiyla birebir ayni sozlesme.
 * Kaynak: src/shared/presentation/response.ts
 */
import { z } from 'zod';

export const apiMetaSchema = z.looseObject({
  requestId: z.string().nullable().optional(),
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
  total: z.number().int().optional(),
  totalPages: z.number().int().optional(),
});

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().nullable(),
    requestId: z.string().nullable(),
  }),
});

export function apiSuccessSchema<T extends z.ZodType>(data: T) {
  return z.object({
    success: z.literal(true),
    data,
    meta: apiMetaSchema,
  });
}

export type ApiMeta = z.infer<typeof apiMetaSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
