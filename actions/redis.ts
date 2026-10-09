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
 * 1. SCAN Algoritması ile Non-Blocking Anahtar Listeleme
 * 'KEYS *' yerine Redis'i kilitlemeyecek SCAN kullanır.
 */
export async function getRedisKeys(
  pattern = '*',
  count = 200,
  cursor = '0'
): Promise<{
  keys: RedisKeyItem[];
  nextCursor: string;
  totalFound: number;
}> {
  try {
    const [newCursor, scannedKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);

    if (scannedKeys.length === 0) {
      return { keys: [], nextCursor: newCursor, totalFound: 0 };
    }

    // PIPELINE ile tüm key'lerin tip ve TTL bilgilerini paralel/tek istekte çek
    const pipeline = redis.pipeline();
    scannedKeys.forEach((key) => {
      pipeline.type(key);
      pipeline.ttl(key);
    });

    const results = await pipeline.exec();

    const keysWithMeta: RedisKeyItem[] = scannedKeys.map((key, index) => {
      const typeResult = (results?.[index * 2]?.[1] as string) || 'unknown';
      const ttlResult = (results?.[index * 2 + 1]?.[1] as number) || -1;

      return {
        key,
        type: typeResult as RedisKeyItem['type'],
        ttl: ttlResult,
      };
    });

    return {
      keys: keysWithMeta,
      nextCursor: newCursor,
      totalFound: keysWithMeta.length,
    };
  } catch (error: any) {
    console.error('SCAN Hatası:', error);
    throw new Error(`Redis anahtarları taranırken hata oluştu: ${error.message}`);
  }
}

/**
 * 2. Key Tipi Bilgisine Göre Genel Veri Çekme (String, JSON)
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
      default: {
        return { data: null, ttl };
      }
    }
  } catch (error: any) {
    throw new Error(`Veri okuma hatası (${key}): ${error.message}`);
  }
}

/**
 * 3. GÜVENLİ LİSTE OKUMA (List Pagination - LRANGE)
 * Benchmark kilitlenmelerini önlemek için '0 -1' yerine limitli aralık okur.
 */
export async function getListItems(
  key: string,
  start = 0,
  stop = 49
): Promise<{ items: string[]; totalLength: number; ttl: number }> {
  try {
    const pipeline = redis.pipeline();
    pipeline.lrange(key, start, stop); // Sadece hedeflenen aralığı çek
    pipeline.llen(key);                // Toplam liste eleman sayısı (O(1))
    pipeline.ttl(key);

    const results = await pipeline.exec();

    const items = (results?.[0]?.[1] as string[]) || [];
    const totalLength = (results?.[1]?.[1] as number) || 0;
    const ttl = (results?.[2]?.[1] as number) || -1;

    return { items, totalLength, ttl };
  } catch (error: any) {
    throw new Error(`List verisi çekilirken hata oluştu: ${error.message}`);
  }
}

/**
 * 4. GÜVENLİ HASH OKUMA (HSCAN)
 * 'HGETALL' yerine çok büyük Hash yapılarını kilitlememek için HSCAN kullanır.
 */
export async function getHashFields(
  key: string,
  cursor = '0',
  count = 100
): Promise<{ fields: { field: string; value: string }[]; nextCursor: string; ttl: number }> {
  try {
    const [nextCursor, rawFields] = await redis.hscan(key, cursor, 'COUNT', count);
    const ttl = await redis.ttl(key);

    const fields: { field: string; value: string }[] = [];
    for (let i = 0; i < rawFields.length; i += 2) {
      fields.push({
        field: rawFields[i],
        value: rawFields[i + 1],
      });
    }

    return { fields, nextCursor, ttl };
  } catch (error: any) {
    throw new Error(`Hash verisi taranırken hata oluştu: ${error.message}`);
  }
}

/**
 * 5. GÜVENLİ SET & ZSET OKUMA (SSCAN / ZSCAN)
 */
export async function getSetMembers(key: string, cursor = '0', count = 100) {
  try {
    const [nextCursor, members] = await redis.sscan(key, cursor, 'COUNT', count);
    const ttl = await redis.ttl(key);
    return { members, nextCursor, ttl };
  } catch (error: any) {
    throw new Error(`Set üyeleri taranırken hata oluştu: ${error.message}`);
  }
}

export async function getZSetMembers(key: string, start = 0, stop = 49) {
  try {
    const pipeline = redis.pipeline();
    pipeline.zrange(key, start, stop, 'WITHSCORES');
    pipeline.zcard(key);
    pipeline.ttl(key);

    const results = await pipeline.exec();
    const rawResult = (results?.[0]?.[1] as string[]) || [];
    const totalLength = (results?.[1]?.[1] as number) || 0;
    const ttl = (results?.[2]?.[1] as number) || -1;

    const members: { value: string; score: number }[] = [];
    for (let i = 0; i < rawResult.length; i += 2) {
      members.push({
        value: rawResult[i],
        score: Number(rawResult[i + 1]),
      });
    }

    return { members, totalLength, ttl };
  } catch (error: any) {
    throw new Error(`ZSet üyeleri çekilirken hata oluştu: ${error.message}`);
  }
}

/**
 * 6. Key Oluşturma ve Güncelleme İşlemleri
 */
export async function setKeyValue(
  key: string,
  value: any,
  type: RedisKeyItem['type'],
  ttl = -1
) {
  try {
    if (type === 'string' || type === 'json') {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl > 0) {
        await redis.set(key, stringValue, 'EX', ttl);
      } else {
        await redis.set(key, stringValue);
        if (ttl === -1) await redis.persist(key);
      }
    }

    return { success: true };
  } catch (error: any) {
    throw new Error(`Veri kaydetme hatası: ${error.message}`);
  }
}

/**
 * 7. List, Hash ve Set Aksiyonları
 */
export async function pushListItem(key: string, value: string, position: 'head' | 'tail' = 'tail') {
  try {
    if (position === 'head') {
      await redis.lpush(key, value);
    } else {
      await redis.rpush(key, value);
    }
    return { success: true };
  } catch (error: any) {
    throw new Error(`Listeye eleman eklenemedi: ${error.message}`);
  }
}

export async function setHashField(key: string, field: string, value: string) {
  try {
    await redis.hset(key, field, value);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Hash alanı güncellenemedi: ${error.message}`);
  }
}

export async function deleteHashField(key: string, field: string) {
  try {
    await redis.hdel(key, field);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Hash alanı silinemedi: ${error.message}`);
  }
}

/**
 * 8. Key ve TTL Yönetimi
 */
export async function setKeyTtl(key: string, ttlSeconds: number) {
  try {
    if (ttlSeconds <= 0) {
      await redis.persist(key);
    } else {
      await redis.expire(key, ttlSeconds);
    }
    return { success: true };
  } catch (error: any) {
    throw new Error(`TTL ayarlanamadı: ${error.message}`);
  }
}

export async function deleteRedisKey(key: string) {
  try {
    await redis.del(key);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Anahtar silinemedi: ${error.message}`);
  }
}

/**
 * 9. CLI Üzerinden Özel Komut Çalıştırma (Güvenlik Korumalı)
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