// lib/redis.ts
import Redis, { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const options: RedisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  // SSL/TLS gerekirse:
  // tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
};

declare global {
  // eslint-disable-next-line no-var
  var redisGlobal: Redis | undefined;
}

export const redis = globalThis.redisGlobal ?? new Redis(redisUrl, options);

if (process.env.NODE_ENV !== 'production') {
  globalThis.redisGlobal = redis;
}