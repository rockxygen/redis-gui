// lib/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Environment değişkeninden 32 karakterlik gizli anahtar
const SECRET_KEY = process.env.ENCRYPTION_SECRET || '12345678901234567890123456789012';

export function encryptData(data: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptData(encryptedText: string): string {
  const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');
  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error('Geçersiz şifrelenmiş veri formatı');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}