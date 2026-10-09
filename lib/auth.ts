// lib/auth.ts
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { encryptData, decryptData } from '@/lib/encrypt';

export interface UserAuthSession {
  username: string;
  mustChangePassword: boolean;
}

const AUTH_COOKIE_NAME = 'redis_gui_auth_session';
const USER_CREDENTIALS_COOKIE_NAME = 'redis_gui_user_creds';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD_HASH = hashPassword('123456');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getUserCredentials(): Promise<{ username: string; passwordHash: string; mustChangePassword: boolean }> {
  const cookieStore = await cookies();
  const encryptedCreds = cookieStore.get(USER_CREDENTIALS_COOKIE_NAME)?.value;

  if (!encryptedCreds) {
    return {
      username: DEFAULT_USERNAME,
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
    };
  }

  try {
    return JSON.parse(decryptData(encryptedCreds));
  } catch {
    return {
      username: DEFAULT_USERNAME,
      passwordHash: DEFAULT_PASSWORD_HASH,
      mustChangePassword: true,
    };
  }
}

export async function readSessionFromCookies(): Promise<UserAuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    return JSON.parse(decryptData(sessionCookie));
  } catch {
    return null;
  }
}

export async function saveUserCredentials(username: string, newPasswordHash: string) {
  const cookieStore = await cookies();
  const updatedCreds = {
    username,
    passwordHash: newPasswordHash,
    mustChangePassword: false,
  };

  cookieStore.set(USER_CREDENTIALS_COOKIE_NAME, encryptData(JSON.stringify(updatedCreds)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  await createSession({ username, mustChangePassword: false });
}

export async function createSession(session: UserAuthSession) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, encryptData(JSON.stringify(session)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}