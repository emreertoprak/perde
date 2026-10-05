import { z } from 'zod';

import type { Page } from '../application/pagination.js';
import type { PaginationMeta } from './response.js';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function buildPaginationMeta(page: Page<unknown>): PaginationMeta {
  return {
    page: page.page,
    limit: page.limit,
    total: page.total,
    totalPages: Math.ceil(page.total / page.limit),
  };
}
