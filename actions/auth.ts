// app/actions/auth.ts
'use server';

import { 
  getUserCredentials, 
  hashPassword, 
  createSession, 
  saveUserCredentials, 
  destroySession, 
  readSessionFromCookies 
} from '@/lib/auth';

/**
 * İstemciden Güvenli Oturum Kontrolü (Server Action)
 */
export async function getCheckSessionAction() {
  return await readSessionFromCookies();
}

/**
 * Giriş Yapma İşlemi
 */
export async function loginAction(username: string, password: string) {
  const user = await getUserCredentials();

  if (username !== user.username || hashPassword(password) !== user.passwordHash) {
    return { success: false, error: 'Kullanıcı adı veya şifre hatalı!' };
  }

  await createSession({
    username: user.username,
    mustChangePassword: user.mustChangePassword,
  });

  return { success: true, mustChangePassword: user.mustChangePassword };
}

/**
 * Şifre Güncelleme İşlemi
 */
export async function changePasswordAction(currentPassword: string, newPassword: string) {
  const user = await getUserCredentials();
  const session = await readSessionFromCookies();

  if (!session) {
    return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
  }

  if (hashPassword(currentPassword) !== user.passwordHash) {
    return { success: false, error: 'Mevcut şifreniz yanlış.' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır.' };
  }

  const newHash = hashPassword(newPassword);
  await saveUserCredentials(user.username, newHash);

  return { success: true };
}

/**
 * Oturumu Kapatma
 */
export async function logoutAction() {
  await destroySession();
  return { success: true };
}