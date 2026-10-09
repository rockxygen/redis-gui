// components/redis/hash-editor.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { KeyRound, Trash2, Clock, Plus, Save, Check, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getHashFields, setHashField, deleteHashField, setKeyTtl } from '@/actions/redis';

export interface HashField {
  field: string;
  value: string;
}

interface HashEditorProps {
  keyName: string;
  initialTtl?: number;
  onDeleteKey: (key: string) => Promise<void>;
}

export function HashEditor({ keyName, initialTtl = -1, onDeleteKey }: HashEditorProps) {
  const [fields, setFields] = useState<HashField[]>([]);
  const [ttl, setTtl] = useState(initialTtl);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Düzenleme / Ekleme State'leri
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [newField, setNewField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  const loadFields = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getHashFields(keyName, '0', 300);
      setFields(res.fields);
      if (res.ttl !== undefined) setTtl(res.ttl);
    } catch (err) {
      console.error('Hash yükleme hatası:', err);
    } finally {
      setIsLoading(false);
    }
  }, [keyName]);

  useEffect(() => {
    loadFields();
  }, [keyName, loadFields]);

  // Arama Filtresi
  const filteredFields = fields.filter(
    (f) =>
      f.field.toLowerCase().includes(search.toLowerCase()) ||
      f.value.toLowerCase().includes(search.toLowerCase())
  );

  // Virtualizer Entegrasyonu
  const rowVirtualizer = useVirtualizer({
    count: filteredFields.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 5,
  });

  const handleSaveField = async (field: string) => {
    const val = editedValues[field];
    if (val === undefined) return;

    await setHashField(keyName, field, val);
    setFields((prev) => prev.map((f) => (f.field === field ? { ...f, value: val } : f)));
    setEditedValues((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const handleAddField = async () => {
    if (!newField.trim()) return;
    await setHashField(keyName, newField.trim(), newValue);
    setNewField('');
    setNewValue('');
    setIsAdding(false);
    loadFields();
  };

  const handleDeleteField = async (field: string) => {
    await deleteHashField(keyName, field);
    setFields((prev) => prev.filter((f) => f.field !== field));
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border select-none">
      {/* Üst Bar */}
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <KeyRound className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-mono text-sm font-semibold truncate">{keyName}</span>
            <Badge variant="outline" className="uppercase text-[10px] bg-amber-500/15 text-amber-500 border-amber-500/30 font-bold shrink-0">
              HASH ({fields.length} fields)
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

        {/* TTL ve Arama Barı */}
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
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Field / Value ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-7 text-xs"
              />
            </div>
            <Button size="sm" onClick={() => setIsAdding(!isAdding)} className="h-7 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" /> Ekle
            </Button>
          </div>
        </div>

        {/* Yeni Field Ekleme Barı */}
        {isAdding && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input
              placeholder="Field adı"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              className="h-8 text-xs font-mono w-1/3"
            />
            <Input
              placeholder="Value değeri"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="h-8 text-xs font-mono flex-1"
            />
            <Button size="sm" onClick={handleAddField} className="h-8 text-xs">
              Kaydet
            </Button>
          </div>
        )}
      </div>

      {/* Tablo Header */}
      <div className="flex items-center px-4 py-2 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground shrink-0">
        <div className="w-1/3">Field</div>
        <div className="flex-1">Value</div>
        <div className="w-16 text-right">İşlem</div>
      </div>

      {/* Sanallaştırılmış Hash Tablo Alanı */}
      <div ref={parentRef} className="flex-1 overflow-y-auto relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs">Hash alanları yükleniyor...</span>
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Gösterilecek field bulunamadı.
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
              const item = filteredFields[virtualRow.index];
              const isEdited = editedValues[item.field] !== undefined && editedValues[item.field] !== item.value;

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
                  className="flex items-center px-4 border-b border-border/50 text-xs font-mono hover:bg-muted/30 transition-colors group"
                >
                  <div className="w-1/3 font-semibold text-foreground truncate pr-2">{item.field}</div>
                  <div className="flex-1 pr-2">
                    <Input
                      value={editedValues[item.field] ?? item.value}
                      onChange={(e) =>
                        setEditedValues((prev) => ({ ...prev, [item.field]: e.target.value }))
                      }
                      className={`h-6 text-xs font-mono px-2 ${
                        isEdited ? 'border-amber-500 focus-visible:ring-amber-500' : 'border-transparent bg-transparent hover:border-input'
                      }`}
                    />
                  </div>
                  <div className="w-16 text-right flex items-center justify-end gap-1">
                    {isEdited && (
                      <Button
                        size="icon"
                        onClick={() => handleSaveField(item.field)}
                        className="h-6 w-6 bg-amber-500 hover:bg-amber-600"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteField(item.field)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}