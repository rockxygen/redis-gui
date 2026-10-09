// components/redis/list-editor.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  ListOrdered, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Save, 
  Check, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getListItems, pushListItem, deleteRedisKey, setKeyTtl } from '@/actions/redis';

interface ListEditorProps {
  keyName: string;
  initialTtl?: number;
  onDeleteKey: (key: string) => Promise<void>;
}

const PAGE_SIZE = 100; // Her sayfada 100 eleman (bunlar sanallaştırılacak)

export function ListEditor({ keyName, initialTtl = -1, onDeleteKey }: ListEditorProps) {
  const [items, setItems] = useState<string[]>([]);
  const [totalLength, setTotalLength] = useState(0);
  const [ttl, setTtl] = useState(initialTtl);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Ekleme Formu
  const [newItemValue, setNewItemValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  // Veri yükleme
  const loadPage = useCallback(async (pageIndex: number) => {
    setIsLoading(true);
    try {
      const start = pageIndex * PAGE_SIZE;
      const stop = start + PAGE_SIZE - 1;
      const res = await getListItems(keyName, start, stop);

      setItems(res.items);
      setTotalLength(res.totalLength);
      if (res.ttl !== undefined) setTtl(res.ttl);
    } catch (err) {
      console.error('List sayfa yükleme hatası:', err);
    } finally {
      setIsLoading(false);
    }
  }, [keyName]);

  useEffect(() => {
    setPage(0);
    loadPage(0);
  }, [keyName, loadPage]);

  // @tanstack/react-virtual Yapılandırması
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Her satırın yüksekliği (px)
    overscan: 5, // Görüş alanı dışı ön yükleme miktarı
  });

  const handleAddItem = async (position: 'head' | 'tail') => {
    if (!newItemValue.trim()) return;
    await pushListItem(keyName, newItemValue.trim(), position);
    setNewItemValue('');
    setIsAdding(false);
    loadPage(page);
  };

  const handleUpdateTtl = async () => {
    await setKeyTtl(keyName, ttl);
  };

  const totalPages = Math.ceil(totalLength / PAGE_SIZE);

  return (
    <div className="h-full flex flex-col bg-background border-l border-border select-none">
      {/* Üst Bilgi Barı */}
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <ListOrdered className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="font-mono text-sm font-semibold truncate">{keyName}</span>
            <Badge variant="outline" className="uppercase text-[10px] bg-blue-500/15 text-blue-500 border-blue-500/30 font-bold shrink-0">
              LIST ({totalLength.toLocaleString()} items)
            </Badge>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteKey(keyName)}
            className="h-8 text-xs gap-1.5 shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Key'i Sil
          </Button>
        </div>

        {/* TTL Barı & Ekleme Butonu */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">TTL (s):</span>
            <Input
              type="number"
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              onBlur={handleUpdateTtl}
              className="w-24 h-7 text-xs font-mono"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Eleman Ekle
          </Button>
        </div>

        {/* Yeni Eleman Ekleme Paneli */}
        {isAdding && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input
              placeholder="Yeni liste elemanı..."
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
              className="h-8 text-xs font-mono flex-1"
            />
            <Button size="sm" onClick={() => handleAddItem('head')} variant="outline" className="h-8 text-xs">
              Başa Ekle
            </Button>
            <Button size="sm" onClick={() => handleAddItem('tail')} className="h-8 text-xs">
              Sona Ekle
            </Button>
          </div>
        )}
      </div>

      {/* Sanallaştırılmış Liste (Virtual List Container) */}
      <div ref={parentRef} className="flex-1 overflow-y-auto relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs">Elemanlar yükleniyor...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Liste boş.
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const val = items[virtualRow.index];
              const globalIndex = page * PAGE_SIZE + virtualRow.index;

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center px-4 border-b border-border/50 text-xs font-mono hover:bg-muted/30 transition-colors"
                >
                  <span className="w-16 text-muted-foreground shrink-0">[{globalIndex}]</span>
                  <span className="truncate flex-1 text-foreground" title={val}>
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alt Sayfalama (Pagination Bar) */}
      <div className="p-3 border-t border-border flex items-center justify-between text-xs bg-muted/20 shrink-0">
        <span className="text-muted-foreground font-mono">
          Gösterilen: {page * PAGE_SIZE} - {Math.min((page + 1) * PAGE_SIZE, totalLength)} / {totalLength}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const prev = page - 1;
              setPage(prev);
              loadPage(prev);
            }}
            disabled={page === 0 || isLoading}
            className="h-7 text-xs gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Önceki
          </Button>

          <span className="font-mono px-2">
            {page + 1} / {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = page + 1;
              setPage(next);
              loadPage(next);
            }}
            disabled={(page + 1) * PAGE_SIZE >= totalLength || isLoading}
            className="h-7 text-xs gap-1"
          >
            Sonraki <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}