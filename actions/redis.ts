// app/actions/redis.ts
'use server';

import { getActiveRedisClient } from '@/actions/connections';
import { validateCommand } from '@/lib/security';

export interface RedisKeyItem {
  key: string;
  type: 'string' | 'hash' | 'list' | 'set' | 'zset' | 'json' | 'stream' | 'unknown';
  ttl: number;
}

export interface StreamEntry {
  id: string;
  fields: Record<string, string>;
}

/**
 * 1. SCAN Algoritması ile Non-Blocking Anahtar Listeleme
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
  const { client: redis } = await getActiveRedisClient();

  try {
    const [newCursor, scannedKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);

    if (scannedKeys.length === 0) {
      return { keys: [], nextCursor: newCursor, totalFound: 0 };
    }

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
  } finally {
    await redis.quit();
  }
}

/**
 * 2. Key Tipi Bilgisine Göre Genel Veri Çekme (String, JSON)
 */
export async function getKeyValue(key: string, type: RedisKeyItem['type']) {
  const { client: redis } = await getActiveRedisClient();

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
  } finally {
    await redis.quit();
  }
}

/**
 * 3. GÜVENLİ LİSTE OKUMA (List Pagination - LRANGE)
 */
export async function getListItems(
  key: string,
  start = 0,
  stop = 49
): Promise<{ items: string[]; totalLength: number; ttl: number }> {
  const { client: redis } = await getActiveRedisClient();

  try {
    const pipeline = redis.pipeline();
    pipeline.lrange(key, start, stop);
    pipeline.llen(key);
    pipeline.ttl(key);

    const results = await pipeline.exec();

    const items = (results?.[0]?.[1] as string[]) || [];
    const totalLength = (results?.[1]?.[1] as number) || 0;
    const ttl = (results?.[2]?.[1] as number) || -1;

    return { items, totalLength, ttl };
  } catch (error: any) {
    throw new Error(`List verisi çekilirken hata oluştu: ${error.message}`);
  } finally {
    await redis.quit();
  }
}

/**
 * 4. GÜVENLİ HASH OKUMA (HSCAN)
 */
export async function getHashFields(
  key: string,
  cursor = '0',
  count = 100
): Promise<{ fields: { field: string; value: string }[]; nextCursor: string; ttl: number }> {
  const { client: redis } = await getActiveRedisClient();

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
  } finally {
    await redis.quit();
  }
}

/**
 * 5. GÜVENLİ STREAM OKUMA (XREVRANGE)
 */
export async function getStreamEntries(
  key: string,
  count = 50,
  endId = '+',
  startId = '-'
): Promise<{ entries: StreamEntry[]; totalLength: number; ttl: number }> {
  const { client: redis } = await getActiveRedisClient();

  try {
    const pipeline = redis.pipeline();
    pipeline.xrevrange(key, endId, startId, 'COUNT', count);
    pipeline.xlen(key);
    pipeline.ttl(key);

    const results = await pipeline.exec();

    const rawEntries = (results?.[0]?.[1] as any[]) || [];
    const totalLength = (results?.[1]?.[1] as number) || 0;
    const ttl = (results?.[2]?.[1] as number) || -1;

    const entries: StreamEntry[] = rawEntries.map(([id, fieldsArray]: [string, string[]]) => {
      const fieldsObj: Record<string, string> = {};
      for (let i = 0; i < fieldsArray.length; i += 2) {
        fieldsObj[fieldsArray[i]] = fieldsArray[i + 1];
      }
      return { id, fields: fieldsObj };
    });

    return { entries, totalLength, ttl };
  } catch (error: any) {
    throw new Error(`Stream verisi okunurken hata oluştu: ${error.message}`);
  } finally {
    await redis.quit();
  }
}

/**
 * 6. STREAM ENTRY EKLEME (XADD) VE SİLME (XDEL)
 */
export async function addStreamEntry(
  key: string,
  fields: Record<string, string>,
  customId = '*'
) {
  const { client: redis } = await getActiveRedisClient();

  try {
    const args: string[] = [];
    Object.entries(fields).forEach(([k, v]) => {
      args.push(k, v);
    });

    const generatedId = await redis.xadd(key, customId, ...args);
    return { success: true, id: generatedId };
  } catch (error: any) {
    throw new Error(`Stream'e veri eklenemedi: ${error.message}`);
  } finally {
    await redis.quit();
  }
}

export async function deleteStreamEntry(key: string, entryId: string) {
  const { client: redis } = await getActiveRedisClient();

  try {
    await redis.xdel(key, entryId);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Stream entry silinemedi: ${error.message}`);
  } finally {
    await redis.quit();
  }
}

/**
 * Key Oluşturma ve Güncelleme İşlemleri (String, JSON, Hash, List)
 */
export async function setKeyValue(
  key: string,
  value: any,
  type: RedisKeyItem['type'],
  ttl = -1
) {
  const { client: redis } = await getActiveRedisClient();

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
    else if (type === 'hash') {
      let hashData: Record<string, string> = {};

      // Kullanıcı JSON formatında mı girdi yoksa tek bir string mi girdi kontrol et
      if (typeof value === 'string') {
        try {
          hashData = JSON.parse(value);
        } catch {
          // JSON değilse varsayılan olarak "value" alan adı altına yaz
          hashData = { value: value };
        }
      } else {
        hashData = value;
      }

      await redis.hset(key, hashData);
      if (ttl > 0) await redis.expire(key, ttl);
    } 
    else if (type === 'list') {
      let items: string[] = [];

      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            items = parsed.map((item) => String(item));
          } else {
            items = [value];
          }
        } catch {
          // Satır sonu veya virgüle göre elemanlara ayır
          items = value
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

          if (items.length === 0) items = [value];
        }
      } else if (Array.isArray(value)) {
        items = value;
      }

      await redis.rpush(key, ...items);
      if (ttl > 0) await redis.expire(key, ttl);
    }

    return { success: true };
  } catch (error: any) {
    throw new Error(`Veri kaydetme hatası (${type}): ${error.message}`);
  } finally {
    await redis.quit();
  }
}

/**
 * 8. List ve Hash Aksiyonları
 */
export async function pushListItem(key: string, value: string, position: 'head' | 'tail' = 'tail') {
  const { client: redis } = await getActiveRedisClient();

  try {
    if (position === 'head') {
      await redis.lpush(key, value);
    } else {
      await redis.rpush(key, value);
    }
    return { success: true };
  } catch (error: any) {
    throw new Error(`Listeye eleman eklenemedi: ${error.message}`);
  } finally {
    await redis.quit();
  }
}

export async function setHashField(key: string, field: string, value: string) {
  const { client: redis } = await getActiveRedisClient();

  try {
    await redis.hset(key, field, value);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Hash alanı güncellenemedi: ${error.message}`);
  } finally {
    await redis.quit();
  }
}

export async function deleteHashField(key: string, field: string) {
  const { client: redis } = await getActiveRedisClient();

  try {
    await redis.hdel(key, field);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Hash alanı silinemedi: ${error.message}`);
  } finally {
    await redis.quit();
  }
}

/**
 * 9. Key ve TTL Yönetimi
 */
export async function setKeyTtl(key: string, ttlSeconds: number) {
  const { client: redis } = await getActiveRedisClient();

  try {
    if (ttlSeconds <= 0) {
      await redis.persist(key);
    } else {
      await redis.expire(key, ttlSeconds);
    }
    return { success: true };
  } catch (error: any) {
    throw new Error(`TTL ayarlanamadı: ${error.message}`);
  } finally {
    await redis.quit();
  }
}

export async function deleteRedisKey(key: string) {
  const { client: redis } = await getActiveRedisClient();

  try {
    await redis.del(key);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Anahtar silinemedi: ${error.message}`);
  } finally {
    await redis.quit();
  }
}

/**
 * 10. CLI Üzerinden Özel Komut Çalıştırma (Güvenlik Korumalı)
 */
export async function executeRedisCommand(rawCommand: string) {
  const validation = validateCommand(rawCommand);
  if (!validation.isValid) {
    return { success: false, error: validation.reason };
  }

  const { client: redis } = await getActiveRedisClient();

  try {
    const parts = rawCommand.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const result = await redis.call(command, ...args);
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    await redis.quit();
  }
}