// app/actions/health.ts
'use server';

import { getActiveRedisClient } from '@/actions/connections';

export async function checkRedisHealth(): Promise<{ isAlive: boolean; latencyMs?: number; error?: string }> {
  const startTime = Date.now();
  try {
    const { client: redis } = await getActiveRedisClient();
    const response = await redis.ping();
    const latencyMs = Date.now() - startTime;
    await redis.quit();

    return {
      isAlive: response === 'PONG',
      latencyMs,
    };
  } catch (error: any) {
    return {
      isAlive: false,
      error: error.message || 'Sunucuya ulaşılamıyor.',
    };
  }
}