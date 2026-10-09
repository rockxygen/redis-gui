// lib/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Environment değişkenlerinden 32 karakterlik secret key
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'a-32-character-ultra-secure-key!';

export function encryptConnectionUrl(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptConnectionUrl(encryptedText: string): string {
  const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');
  if (!ivHex || !authTagHex || !encryptedData) throw new Error('Geçersiz şifrelenmiş veri formatı');

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}