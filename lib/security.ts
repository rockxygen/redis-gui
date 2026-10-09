// lib/security.ts

const BLOCKED_COMMANDS = new Set([
  'FLUSHALL',
  'FLUSHDB',
  'SHUTDOWN',
  'DEBUG',
  'SLAVEOF',
  'REPLICAOF',
  'CONFIG',
]);

export function validateCommand(command: string): { isValid: boolean; reason?: string } {
  const firstWord = command.trim().split(/\s+/)[0]?.toUpperCase();

  if (!firstWord) {
    return { isValid: false, reason: 'Komut boş olamaz.' };
  }

  if (BLOCKED_COMMANDS.has(firstWord)) {
    return {
      isValid: false,
      reason: `"${firstWord}" komutu güvenlik nedeniyle bu GUI üzerinden engellenmiştir.`,
    };
  }

  if (firstWord === 'KEYS') {
    return {
      isValid: false,
      reason: '"KEYS *" komutu Redis performansını kilitlediği için engellenmiştir. Lütfen SCAN filtresini kullanın.',
    };
  }

  return { isValid: true };
}