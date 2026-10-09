// lib/redis-formatter.ts

export function formatRedisOutput(output: any, indentLevel = 0): string {
  if (output === null || output === undefined) {
    return '(nil)';
  }

  if (typeof output === 'number') {
    return `(integer) ${output}`;
  }

  if (typeof output === 'boolean') {
    return output ? '(integer) 1' : '(integer) 0';
  }

  if (typeof output === 'string') {
    // Tırnak içindeki özel karakterleri ve alt satırları koru
    return `"${output}"`;
  }

  if (Array.isArray(output)) {
    if (output.length === 0) {
      return '(empty array)';
    }

    const indent = '  '.repeat(indentLevel);
    return output
      .map((item, index) => {
        const itemNumber = `${index + 1})`;
        const formattedItem = formatRedisOutput(item, indentLevel + 1);
        return `${indent}${itemNumber} ${formattedItem}`;
      })
      .join('\n');
  }

  if (typeof output === 'object') {
    return JSON.stringify(output, null, 2);
  }

  return String(output);
}