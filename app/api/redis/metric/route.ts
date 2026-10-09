// app/api/redis/metrics/route.ts
import { NextResponse } from 'next/server';
import Redis from 'ioredis';

// Ortam değişkenlerinden veya bağlantı yöneticinizden alabilirsiniz
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function GET() {
  try {
    const rawInfo = await redis.info();

    // Raw INFO metnini key-value objesine parse et
    const infoMap: Record<string, string> = {};
    rawInfo.split('\r\n').forEach((line) => {
      if (line && !line.startsWith('#')) {
        const [key, val] = line.split(':');
        if (key && val) infoMap[key.trim()] = val.trim();
      }
    });

    const usedMemoryMb = Number(
      (parseInt(infoMap['used_memory'] || '0') / 1024 / 1024).toFixed(2)
    );
    const peakMemoryMb = Number(
      (parseInt(infoMap['used_memory_peak'] || '0') / 1024 / 1024).toFixed(2)
    );
    const opsPerSec = parseInt(infoMap['instantaneous_ops_per_sec'] || '0');
    const connectedClients = parseInt(infoMap['connected_clients'] || '0');

    const hits = parseInt(infoMap['keyspace_hits'] || '0');
    const misses = parseInt(infoMap['keyspace_misses'] || '0');
    const totalHitsMisses = hits + misses;
    const hitRate = totalHitsMisses > 0 ? Number(((hits / totalHitsMisses) * 100).toFixed(1)) : 100;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    return NextResponse.json({
      time: timeStr,
      usedMemoryMb,
      peakMemoryMb,
      opsPerSec,
      connectedClients,
      hitRate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}