// app/actions/metrics.ts
'use server';

import { redis } from '@/lib/redis';

export interface MetricPoint {
  time: string;
  usedMemoryMb: number;
  peakMemoryMb: number;
  opsPerSec: number;
  connectedClients: number;
  hitRate: number;
  totalKeys: number;
  uptimeInDays: number;
}

/**
 * Raw Redis INFO metin çıktısını Key-Value nesnesine dönüştürür
 */
function parseRedisInfo(rawInfo: string): Record<string, string> {
  const infoMap: Record<string, string> = {};
  const lines = rawInfo.split('\r\n');

  for (const line of lines) {
    if (line && !line.startsWith('#')) {
      const indexOfColon = line.indexOf(':');
      if (indexOfColon !== -1) {
        const key = line.substring(0, indexOfColon).trim();
        const value = line.substring(indexOfColon + 1).trim();
        infoMap[key] = value;
      }
    }
  }

  return infoMap;
}

/**
 * db0, db1 gibi keyspace satırlarından toplam key sayısını çıkartır
 * Örn satır: "keys=1204,expires=5,avg_ttl=3600"
 */
function parseTotalKeys(infoMap: Record<string, string>): number {
  let totalKeys = 0;
  Object.keys(infoMap).forEach((key) => {
    if (key.startsWith('db')) {
      const dbStr = infoMap[key];
      const match = dbStr.match(/keys=(\d+)/);
      if (match && match[1]) {
        totalKeys += parseInt(match[1], 10);
      }
    }
  });
  return totalKeys;
}

/**
 * Canlı Redis Metriklerini Anlık Olarak Çeker
 */
export async function getRealtimeMetrics(): Promise<MetricPoint> {
  try {
    const rawInfo = await redis.info();
    const info = parseRedisInfo(rawInfo);

    // 1. Memory Hesaplamaları (Bytes -> MB)
    const usedMemoryBytes = parseInt(info['used_memory'] || '0', 10);
    const peakMemoryBytes = parseInt(info['used_memory_peak'] || '0', 10);
    const usedMemoryMb = Number((usedMemoryBytes / 1024 / 1024).toFixed(2));
    const peakMemoryMb = Number((peakMemoryBytes / 1024 / 1024).toFixed(2));

    // 2. Anlık İşlem Hızı ve Bağlantılar
    const opsPerSec = parseInt(info['instantaneous_ops_per_sec'] || '0', 10);
    const connectedClients = parseInt(info['connected_clients'] || '0', 10);

    // 3. Cache Hit Rate Hesaplaması
    const hits = parseInt(info['keyspace_hits'] || '0', 10);
    const misses = parseInt(info['keyspace_misses'] || '0', 10);
    const totalRequests = hits + misses;
    const hitRate =
      totalRequests > 0 ? Number(((hits / totalRequests) * 100).toFixed(1)) : 100;

    // 4. Diğer Özet Bilgiler
    const totalKeys = parseTotalKeys(info);
    const uptimeInSeconds = parseInt(info['uptime_in_seconds'] || '0', 10);
    const uptimeInDays = Number((uptimeInSeconds / 86400).toFixed(1));

    // Zaman Formatı (HH:mm:ss)
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    return {
      time: timeStr,
      usedMemoryMb,
      peakMemoryMb,
      opsPerSec,
      connectedClients,
      hitRate,
      totalKeys,
      uptimeInDays,
    };
  } catch (error: any) {
    console.error('Redis metrics fetch error:', error);
    throw new Error(`Redis metrikleri alınamadı: ${error.message}`);
  }
}