// app/actions/cli.ts
'use server';

import { getActiveRedisClient } from '@/actions/connections';
import { validateCommand } from '@/lib/security';

/**
 * CLI Çıktısını İnsan Tarafından Okunabilir Formata Dönüştürür
 */
function formatCliResult(result: any): string {
  if (result === null) return '(nil)';
  if (result === undefined) return 'OK';
  if (typeof result === 'boolean') return result ? '1' : '0';
  if (typeof result === 'number') return `(integer) ${result}`;
  if (typeof result === 'string') return `"${result}"`;

  if (Array.isArray(result)) {
    if (result.length === 0) return '(empty list or set)';
    return result
      .map((item, index) => `${index + 1})${formatCliResult(item)}`)
      .join('\n');
  }

  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2);
  }

  return String(result);
}

/**
 * CLI Üzerinden Ham Komut Çalıştırma (Dinamik Aktif Sunucu)
 */
export async function executeCliCommand(rawCommand: string): Promise<{
  formattedOutput?: string;
  error?: string;
  executionTimeMs?: number;
}> {
  const trimmed = rawCommand.trim();

  // "CLEAR" komutu terminal ekranını temizler
  if (trimmed.toUpperCase() === 'CLEAR') {
    return { formattedOutput: 'CLEAR_SIGNAL' };
  }

  // Güvenlik Denetimi
  const validation = validateCommand(trimmed);
  if (!validation.isValid) {
    return { error: validation.reason };
  }

  // Aktif seçili Redis sunucu istemcisini dinamik olarak alıyoruz
  const { client: redis } = await getActiveRedisClient();
  const startTime = Date.now();

  try {
    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const result = await redis.call(command, ...args);
    const executionTimeMs = Date.now() - startTime;

    return {
      formattedOutput: formatCliResult(result),
      executionTimeMs,
    };
  } catch (error: any) {
    return {
      error: error.message || 'Komut çalıştırılırken bilinmeyen bir hata oluştu.',
    };
  } finally {
    // İşlem bitince soket bağlantısını kapatıyoruz
    await redis.quit();
  }
}