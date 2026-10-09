// app/actions/cli.ts
'use server';

import { redis } from '@/lib/redis';
import { validateCommand } from '@/lib/security';
import { formatRedisOutput } from '@/lib/redis-formatter';

export interface CommandExecutionResult {
  success: boolean;
  rawOutput?: any;
  formattedOutput?: string;
  error?: string;
  executionTimeMs: number;
}

/**
 * Tırnak içi string parçalarını ve argümanları düzgün ayıran regex ayrıştırıcı
 */
function parseCommandArgs(input: string): string[] {
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const args: string[] = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    // Tırnak içindeki grup varsa onu, yoksa eşleşen kelimeyi al
    args.push(match[1] ?? match[2] ?? match[0]);
  }

  return args;
}

export async function executeCliCommand(rawCommand: string): Promise<CommandExecutionResult> {
  const startTime = performance.now();
  const trimmed = rawCommand.trim();

  if (!trimmed) {
    return {
      success: false,
      error: 'Boş komut gönderilemez.',
      executionTimeMs: 0,
    };
  }

  // Güvenlik kontrolü
  const validation = validateCommand(trimmed);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.reason,
      executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
    };
  }

  try {
    const args = parseCommandArgs(trimmed);
    const commandName = args[0].toUpperCase();
    const commandArgs = args.slice(1);

    // Özel GUI komutları
    if (commandName === 'CLEAR' || commandName === 'CLS') {
      return {
        success: true,
        formattedOutput: 'CLEAR_SIGNAL',
        executionTimeMs: 0,
      };
    }

    if (commandName === 'PING' && commandArgs.length === 0) {
      const endTime = performance.now();
      return {
        success: true,
        formattedOutput: 'PONG',
        executionTimeMs: Number((endTime - startTime).toFixed(2)),
      };
    }

    // Redis komutunu çalıştır
    const result = await redis.call(commandName, ...commandArgs);
    const endTime = performance.now();

    return {
      success: true,
      rawOutput: result,
      formattedOutput: formatRedisOutput(result),
      executionTimeMs: Number((endTime - startTime).toFixed(2)),
    };
  } catch (error: any) {
    const endTime = performance.now();
    return {
      success: false,
      error: error.message || 'Komut çalıştırılırken bilinmeyen bir hata oluştu.',
      executionTimeMs: Number((endTime - startTime).toFixed(2)),
    };
  }
}