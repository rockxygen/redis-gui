// components/redis/stream-editor.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Trash2, 
  Clock, 
  Plus, 
  RefreshCw, 
  Loader2, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  getStreamEntries, 
  addStreamEntry, 
  deleteStreamEntry, 
  setKeyTtl, 
  StreamEntry 
} from '@/actions/redis';

interface StreamEditorProps {
  keyName: string;
  initialTtl?: number;
  onDeleteKey: (key: string) => Promise<void>;
}

export function StreamEditor({ keyName, initialTtl = -1, onDeleteKey }: StreamEditorProps) {
  const [entries, setEntries] = useState<StreamEntry[]>([]);
  const [totalLength, setTotalLength] = useState(0);
  const [ttl, setTtl] = useState(initialTtl);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Ekleme Formu
  const [isAdding, setIsAdding] = useState(false);
  const [fieldKey, setFieldKey] = useState('');
  const [fieldVal, setFieldVal] = useState('');

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getStreamEntries(keyName, 50);
      setEntries(res.entries);
      setTotalLength(res.totalLength);
      if (res.ttl !== undefined) setTtl(res.ttl);
    } catch (err) {
      console.error('Stream okuma hatası:', err);
    } finally {
      setIsLoading(false);
    }
  }, [keyName]);

  useEffect(() => {
    loadEntries();
  }, [keyName, loadEntries]);

  const handleAddEntry = async () => {
    if (!fieldKey.trim() || !fieldVal.trim()) return;
    await addStreamEntry(keyName, { [fieldKey.trim()]: fieldVal.trim() });
    setFieldKey('');
    setFieldVal('');
    setIsAdding(false);
    loadEntries();
  };

  const handleDeleteEntry = async (entryId: string) => {
    await deleteStreamEntry(keyName, entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    setTotalLength((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border select-none">
      {/* Üst Bar */}
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="h-4 w-4 text-indigo-500 shrink-0 animate-pulse" />
            <span className="font-mono text-sm font-semibold truncate">{keyName}</span>
            <Badge variant="outline" className="uppercase text-[10px] bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-bold shrink-0">
              STREAM ({totalLength.toLocaleString()} entries)
            </Badge>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteKey(keyName)}
            className="h-8 text-xs gap-1.5 shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" /> Key'i Sil
          </Button>
        </div>

        {/* TTL ve Yenileme Barı */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">TTL (s):</span>
            <Input
              type="number"
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              onBlur={() => setKeyTtl(keyName, ttl)}
              className="w-24 h-7 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadEntries} className="h-7 text-xs gap-1">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Yenile
            </Button>
            <Button size="sm" onClick={() => setIsAdding(!isAdding)} className="h-7 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" /> Entry Ekle
            </Button>
          </div>
        </div>

        {/* Ekleme Formu */}
        {isAdding && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input
              placeholder="Field (örn: event)"
              value={fieldKey}
              onChange={(e) => setFieldKey(e.target.value)}
              className="h-8 text-xs font-mono w-1/3"
            />
            <Input
              placeholder="Value (örn: user_registered)"
              value={fieldVal}
              onChange={(e) => setFieldVal(e.target.value)}
              className="h-8 text-xs font-mono flex-1"
            />
            <Button size="sm" onClick={handleAddEntry} className="h-8 text-xs">
              XADD
            </Button>
          </div>
        )}
      </div>

      {/* Entry Liste Alanı */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading && entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs">Stream mesajları yükleniyor...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Stream içerisinde mesaj bulunamadı.
          </div>
        ) : (
          entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                className="border border-border rounded-lg bg-card overflow-hidden text-xs font-mono"
              >
                {/* Entry Başlık */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="flex items-center justify-between p-2.5 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-bold text-indigo-400">{entry.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {Object.keys(entry.fields).length} alan
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntry(entry.id);
                      }}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Entry Alanları (Fields & Values) */}
                {isExpanded && (
                  <div className="p-3 border-t border-border bg-background space-y-1">
                    {Object.entries(entry.fields).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-xs">
                        <span className="text-amber-500 font-semibold">{k}:</span>
                        <span className="text-foreground break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}