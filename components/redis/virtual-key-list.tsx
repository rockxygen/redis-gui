// components/redis/virtual-key-list.tsx
'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { KeyNode } from '@/lib/redis-tree';
import { Key, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VirtualKeyListProps {
  nodes: KeyNode[];
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
}

export function VirtualKeyList({ nodes, selectedKey, onSelectKey }: VirtualKeyListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Ekranda görünen elemanları hesaplayan sanallaştırıcı
  const rowVirtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // Her satırın yüksekliği (px)
    overscan: 5, // Ekran dışı önceden yüklenecek satır sayısı
  });

  return (
    <div ref={parentRef} className="h-full overflow-y-auto w-full select-none">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const node = nodes[virtualRow.index];
          const isSelected = selectedKey === node.fullKey;

          return (
            <div
              key={virtualRow.key}
              onClick={() => node.fullKey && onSelectKey(node.fullKey)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`flex items-center justify-between px-3 text-xs cursor-pointer hover:bg-accent/50 ${
                isSelected ? 'bg-primary/15 font-semibold text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {node.isFolder ? (
                  <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{node.name}</span>
              </div>

              {node.type && (
                <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 h-4 shrink-0">
                  {node.type}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}