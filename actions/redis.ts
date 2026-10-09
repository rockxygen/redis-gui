// app/actions/redis.ts
'use server';

import { redis } from '@/lib/redis';
import { validateCommand } from '@/lib/security';

export interface RedisKeyItem {
  key: string;
  type: 'string' | 'hash' | 'list' | 'set' | 'zset' | 'json' | 'stream' | 'unknown';
  ttl: number;
}

/**
 * SCAN algoritması ile non-blocking anahtar listeleme
 */
export async function getRedisKeys(pattern = '*', count = 100): Promise<{
  keys: RedisKeyItem[];
  nextCursor: string;
  totalFound: number;
}> {
  try {
    let cursor = '0';
    const foundKeys: string[] = [];

    // Ilk SCAN adımını çalıştır
    const [newCursor, scannedKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
    cursor = newCursor;
    foundKeys.push(...scannedKeys);

    // Her bir key için PIPELINE kullanarak Tip ve TTL bilgilerini paralel çek
    if (foundKeys.length === 0) {
      return { keys: [], nextCursor: cursor, totalFound: 0 };
    }

    const pipeline = redis.pipeline();
    foundKeys.forEach((key) => {
      pipeline.type(key);
      pipeline.ttl(key);
    });

    const results = await pipeline.exec();

    const keysWithMeta: RedisKeyItem[] = foundKeys.map((key, index) => {
      const typeResult = results?.[index * 2]?.[1] as string || 'unknown';
      const ttlResult = results?.[index * 2 + 1]?.[1] as number || -1;

      return {
        key,
        type: typeResult as RedisKeyItem['type'],
        ttl: ttlResult,
      };
    });

    return {
      keys: keysWithMeta,
      nextCursor: cursor,
      totalFound: keysWithMeta.length,
    };
  } catch (error: any) {
    console.error('Error fetching Redis keys via SCAN:', error);
    throw new Error(`Redis SCAN Hatası: ${error.message}`);
  }
}

/**
 * Seçilen Key'in tipine göre değerini getirir
 */
export async function getKeyValue(key: string, type: RedisKeyItem['type']) {
  try {
    const ttl = await redis.ttl(key);

    switch (type) {
      case 'string':
      case 'json': {
        const value = await redis.get(key);
        return { data: value ?? '', ttl };
      }
      case 'hash': {
        const hashData = await redis.hgetall(key);
        const formatted = Object.entries(hashData).map(([field, value]) => ({ field, value }));
        return { data: formatted, ttl };
      }
      case 'list': {
        const listData = await redis.lrange(key, 0, -1);
        return { data: listData, ttl };
      }
      case 'set': {
        const setData = await redis.smembers(key);
        return { data: setData, ttl };
      }
      case 'zset': {
        const zsetData = await redis.zrange(key, 0, -1, 'WITHSCORES');
        const formatted = [];
        for (let i = 0; i < zsetData.length; i += 2) {
          formatted.push({ value: zsetData[i], score: Number(zsetData[i + 1]) });
        }
        return { data: formatted, ttl };
      }
      default: {
        const raw = await redis.get(key);
        return { data: raw ?? '', ttl };
      }
    }
  } catch (error: any) {
    throw new Error(`Veri okuma hatası (${key}): ${error.message}`);
  }
}

/**
 * Key Değerini Güncelleme veya Yeni Key Ekleme
 */
export async function setKeyValue(
  key: string,
  value: any,
  type: RedisKeyItem['type'],
  ttl = -1
) {
  try {
    if (type === 'string' || type === 'json') {
      if (ttl > 0) {
        await redis.set(key, typeof value === 'string' ? value : JSON.stringify(value), 'EX', ttl);
      } else {
        await redis.set(key, typeof value === 'string' ? value : JSON.stringify(value));
        if (ttl === -1) await redis.persist(key);
      }
    }

    return { success: true };
  } catch (error: any) {
    throw new Error(`Veri kaydetme hatası: ${error.message}`);
  }
}

/**
 * Key Silme
 */
export async function deleteRedisKey(key: string) {
  try {
    await redis.del(key);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Key silinemedi: ${error.message}`);
  }
}

/**
 * CLI Üzerinden Özel Komut Çalıştırma (Güvenlik Korumalı)
 */
export async function executeRedisCommand(rawCommand: string) {
  const validation = validateCommand(rawCommand);
  if (!validation.isValid) {
    return { success: false, error: validation.reason };
  }

  try {
    const parts = rawCommand.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const result = await redis.call(command, ...args);
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}