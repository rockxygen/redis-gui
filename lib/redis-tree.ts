// lib/redis-tree.ts

export interface KeyNode {
  id: string;          // Tam key yolu veya klasör yolu (örn: "user:100")
  name: string;        // Görünür isim (örn: "profile" veya "100")
  fullKey?: string;    // Eğer yaprak düğümse (gerçek Redis key) tam adı
  type?: 'string' | 'hash' | 'list' | 'set' | 'zset' | 'json' | 'stream';
  children?: KeyNode[];
  isFolder: boolean;
}

export function buildKeyTree(
  keys: Array<{ key: string; type?: KeyNode['type'] }>,
  delimiter = ':'
): KeyNode[] {
  const root: KeyNode[] = [];

  for (const item of keys) {
    const parts = item.key.split(delimiter);
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}${delimiter}${part}` : part;
      const isLast = index === parts.length - 1;

      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        existingNode = {
          id: currentPath,
          name: part,
          isFolder: !isLast,
          ...(isLast ? { fullKey: item.key, type: item.type || 'string' } : { children: [] }),
        };
        currentLevel.push(existingNode);
      } else if (!isLast && !existingNode.children) {
        existingNode.children = [];
        existingNode.isFolder = true;
      }

      if (!isLast && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  }

  return root;
}