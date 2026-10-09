// app/actions/connections.ts
'use server';

import { cookies } from 'next/headers';
import Redis from 'ioredis';
import { encryptData, decryptData } from '@/lib/encrypt';

export interface RedisConnectionProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  password?: string;
  tls?: boolean;
}

const CONNECTIONS_COOKIE_NAME = 'redis_gui_connections';
const ACTIVE_CONNECTION_COOKIE_NAME = 'redis_gui_active_id';

/**
 * Mevcut kayıtlı bağlantı profillerini cookie'den çözer ve döndürür
 */
export async function getConnections(): Promise<RedisConnectionProfile[]> {
  const cookieStore = await cookies();
  const encryptedCookie = cookieStore.get(CONNECTIONS_COOKIE_NAME)?.value;

  if (!encryptedCookie) return [];

  try {
    const decryptedJson = decryptData(encryptedCookie);
    return JSON.parse(decryptedJson);
  } catch (error) {
    console.error('Cookie çözme hatası:', error);
    return [];
  }
}

/**
 * Aktif seçili sunucunun ID'sini getirir
 */
export async function getActiveConnectionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_CONNECTION_COOKIE_NAME)?.value || null;
}

/**
 * Aktif seçili sunucu profilini ve canlı ioredis istemcisini döndürür
 */
export async function getActiveRedisClient(): Promise<{ client: Redis; profile: RedisConnectionProfile }> {
  const connections = await getConnections();
  const activeId = await getActiveConnectionId();

  const profile = connections.find((c) => c.id === activeId) || connections[0];

  if (!profile) {
    // Varsayılan localhost bağlantısına düş
    const defaultProfile: RedisConnectionProfile = {
      id: 'default-local',
      name: 'Localhost',
      host: '127.0.0.1',
      port: 6380,
    };
    return {
      client: new Redis({ host: defaultProfile.host, port: defaultProfile.port }),
      profile: defaultProfile,
    };
  }

  const client = new Redis({
    host: profile.host,
    port: profile.port,
    password: profile.password || undefined,
    tls: profile.tls ? {} : undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 2,
  });

  return { client, profile };
}

/**
 * Yeni bağlantı profili ekler ve şifreleyerek HTTP-Only cookie'ye kaydeder
 */
export async function saveConnection(profile: Omit<RedisConnectionProfile, 'id'>) {
  const cookieStore = await cookies();
  const connections = await getConnections();

  const newProfile: RedisConnectionProfile = {
    ...profile,
    id: Math.random().toString(36).substring(2, 9),
  };

  const updated = [...connections, newProfile];
  const encrypted = encryptData(JSON.stringify(updated));

  // HTTP-Only Cookie olarak kaydet (JavaScript erişemez, XSS korumalı)
  cookieStore.set(CONNECTIONS_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 Gün
  });

  // Otomatik olarak yeni eklenen sunucuyu aktif yap
  await setActiveConnection(newProfile.id);

  return { success: true, profile: newProfile };
}

/**
 * Aktif sunucu seçimini değiştirir
 */
export async function setActiveConnection(connectionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CONNECTION_COOKIE_NAME, connectionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * Kayıtlı sunucu profilini siler
 */
export async function deleteConnection(connectionId: string) {
  const cookieStore = await cookies();
  const connections = await getConnections();
  const updated = connections.filter((c) => c.id !== connectionId);

  const encrypted = encryptData(JSON.stringify(updated));
  cookieStore.set(CONNECTIONS_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  const activeId = await getActiveConnectionId();
  if (activeId === connectionId) {
    cookieStore.delete(ACTIVE_CONNECTION_COOKIE_NAME);
  }
}

/**
 * Sunucuya kaydedilmeden önce bağlantı testi yapar (PING)
 */
export async function testRedisConnection(profile: Omit<RedisConnectionProfile, 'id'>) {
  const testClient = new Redis({
    host: profile.host,
    port: profile.port,
    password: profile.password || undefined,
    tls: profile.tls ? {} : undefined,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  });

  try {
    const pong = await testClient.ping();
    await testClient.quit();
    return { success: true, response: pong };
  } catch (error: any) {
    return { success: false, error: error.message || 'Bağlantı kurulamadı.' };
  }
}