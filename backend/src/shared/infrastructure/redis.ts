import { Redis } from 'ioredis';

import type { AppConfig } from '../../config/env.js';

export function createApiRedis(config: AppConfig): Redis {
  return new Redis(config.REDIS_URL, {
    keyPrefix: `${config.REDIS_PREFIX}:`,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
}

export function createWorkerRedis(config: AppConfig): Redis {
  return new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
}

export function createQueueProducerRedis(config: AppConfig): Redis {
  return new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
}

export class CacheService {
  public constructor(
    private readonly redis: Redis,
    private readonly prefix: string,
  ) {}

  public key(module: string, resource: string, id: string): string {
    return `${this.prefix}:${module}:${resource}:${id}`;
  }

  public async getJson<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  }

  public async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  public delete(key: string): Promise<number> {
    return this.redis.del(key);
  }
}
