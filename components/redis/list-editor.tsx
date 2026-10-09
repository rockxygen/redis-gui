// components/redis/list-editor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Search, 
  Clock, 
  ListOrdered, 
  ArrowDownToLine, 
  ArrowUpToLine, 
  Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ListEditorProps {
  keyName: string;
  initialItems: string[];
  initialTtl?: number;
  onPushItem: (value: string, position: 'head' | 'tail') => Promise<void>;
  onSetIndex: (index: number, value: string) => Promise<void>;
  onRemoveIndex: (index: number) => Promise<void>;
  onDeleteKey: (key: string) => Promise<void>;
  onUpdateTtl: (ttl: number) => Promise<void>;
}

export function ListEditor({
  keyName,
  initialItems,
  initialTtl = -1,
  onPushItem,
  onSetIndex,
  onRemoveIndex,
  onDeleteKey,
  onUpdateTtl,
}: ListEditorProps) {
  const [items, setItems] = useState<string[]>(initialItems);
  const [search, setSearch] = useState('');
  const [ttl, setTtl] = useState(initialTtl);

  // Ekleme state'leri
  const [newItemValue, setNewItemValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Düzenleme takibi (index -> newValue)
  const [editedIndices, setEditedIndices] = useState<Record<number, string>>({});
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setTtl(initialTtl);
    setEditedIndices({});
  }, [keyName, initialItems, initialTtl]);

  const handleValueChange = (index: number, val: string) => {
    setEditedIndices((prev) => ({ ...prev, [index]: val }));
  };

  const handleSaveIndex = async (index: number) => {
    const val = editedIndices[index];
    if (val === undefined) return;

    await onSetIndex(index, val);

    setItems((prev) => prev.map((item, i) => (i === index ? val : item)));
    setEditedIndices((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });

    setSavedIndex(index);
    setTimeout(() => setSavedIndex(null), 1500);
  };

  const handleAddItem = async (position: 'head' | 'tail') => {
    if (!newItemValue.trim()) return;

    await onPushItem(newItemValue.trim(), position);

    if (position === 'head') {
      setItems((prev) => [newItemValue.trim(), ...prev]);
    } else {
      setItems((prev) => [...prev, newItemValue.trim()]);
    }

    setNewItemValue('');
    setIsAdding(false);
  };

  const handleRemoveIndex = async (index: number) => {
    await onRemoveIndex(index);
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="h-full flex flex-col border-0 rounded-none border-l border-border bg-background">
      {/* Üst Bilgi Barı */}
      <CardHeader className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <ListOrdered className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="font-mono text-sm font-semibold truncate" title={keyName}>
              {keyName}
            </span>
            <Badge variant="outline" className="uppercase text-[10px] bg-blue-500/15 text-blue-500 border-blue-500/30 font-bold">
              LIST ({items.length} items)
            </Badge>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteKey(keyName)}
            className="h-8 text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Key'i Sil
          </Button>
        </div>

        {/* TTL ve Arama */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">TTL (s):</span>
            <Input
              type="number"
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              onBlur={() => onUpdateTtl(ttl)}
              className="w-24 h-7 text-xs font-mono"
            />
          </div>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="İçerik ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
          </div>
        </div>
      </CardHeader>

      {/* Liste Tablosu */}
      <CardContent className="flex-1 p-0 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50 z-10">
            <TableRow className="text-xs">
              <TableHead className="w-[80px]">Index</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-[100px] text-right">Aksiyonlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Yeni Eleman Ekleme Formu */}
            {isAdding ? (
              <TableRow className="bg-blue-500/5">
                <TableCell className="font-mono text-xs text-muted-foreground">NEW</TableCell>
                <TableCell>
                  <Input
                    placeholder="Eleman Değeri..."
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddItem('head')}
                      title="Başa Ekle (LPUSH)"
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <ArrowUpToLine className="h-3.5 w-3.5" /> Başa
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAddItem('tail')}
                      title="Sona Ekle (RPUSH)"
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" /> Sona
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={3}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdding(true)}
                    className="w-full h-7 text-xs border-dashed gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Yeni Eleman Ekle
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {/* List Öğeleri */}
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                  Liste boş.
                </TableCell>
              </TableRow>
            ) : (
              items.map((val, idx) => {
                if (search && !val.toLowerCase().includes(search.toLowerCase())) {
                  return null;
                }

                const isEdited = editedIndices[idx] !== undefined && editedIndices[idx] !== val;
                const isJustSaved = savedIndex === idx;

                return (
                  <TableRow key={idx} className="text-xs group">
                    <TableCell className="font-mono font-medium text-muted-foreground">
                      [{idx}]
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editedIndices[idx] ?? val}
                        onChange={(e) => handleValueChange(idx, e.target.value)}
                        className={`h-7 text-xs font-mono ${
                          isEdited ? 'border-blue-500 focus-visible:ring-blue-500' : ''
                        }`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEdited && (
                          <Button
                            size="icon"
                            variant="default"
                            onClick={() => handleSaveIndex(idx)}
                            className="h-7 w-7"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isJustSaved && (
                          <span className="text-emerald-500 flex items-center p-1">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveIndex(idx)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}