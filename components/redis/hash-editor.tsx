// components/redis/hash-editor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Search, 
  Clock, 
  KeyRound, 
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

export interface HashField {
  field: string;
  value: string;
}

interface HashEditorProps {
  keyName: string;
  initialFields: HashField[];
  initialTtl?: number;
  onSaveField: (field: string, value: string) => Promise<void>;
  onDeleteField: (field: string) => Promise<void>;
  onDeleteKey: (key: string) => Promise<void>;
  onUpdateTtl: (ttl: number) => Promise<void>;
}

export function HashEditor({
  keyName,
  initialFields,
  initialTtl = -1,
  onSaveField,
  onDeleteField,
  onDeleteKey,
  onUpdateTtl,
}: HashEditorProps) {
  const [fields, setFields] = useState<HashField[]>(initialFields);
  const [search, setSearch] = useState('');
  const [ttl, setTtl] = useState(initialTtl);

  // Yeni alan ekleme formu state'leri
  const [newField, setNewField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Değiştirilen alanların takibi için
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [savedField, setSavedField] = useState<string | null>(null);

  useEffect(() => {
    setFields(initialFields);
    setTtl(initialTtl);
    setEditedFields({});
  }, [keyName, initialFields, initialTtl]);

  const filteredFields = fields.filter(
    (f) =>
      f.field.toLowerCase().includes(search.toLowerCase()) ||
      f.value.toLowerCase().includes(search.toLowerCase())
  );

  const handleValueChange = (fieldName: string, val: string) => {
    setEditedFields((prev) => ({ ...prev, [fieldName]: val }));
  };

  const handleSaveSingleField = async (fieldName: string) => {
    const valToSave = editedFields[fieldName];
    if (valToSave === undefined) return;

    await onSaveField(fieldName, valToSave);

    // Güncel liste durumunu güncelle
    setFields((prev) =>
      prev.map((f) => (f.field === fieldName ? { ...f, value: valToSave } : f))
    );

    // Edited takibinden çıkar
    setEditedFields((prev) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });

    setSavedField(fieldName);
    setTimeout(() => setSavedField(null), 1500);
  };

  const handleAddField = async () => {
    if (!newField.trim()) return;
    await onSaveField(newField.trim(), newValue);
    setFields((prev) => [...prev, { field: newField.trim(), value: newValue }]);
    setNewField('');
    setNewValue('');
    setIsAdding(false);
  };

  const handleDeleteSingleField = async (fieldName: string) => {
    await onDeleteField(fieldName);
    setFields((prev) => prev.filter((f) => f.field !== fieldName));
  };

  return (
    <Card className="h-full flex flex-col border-0 rounded-none border-l border-border bg-background">
      {/* Başlık ve Metadata Barı */}
      <CardHeader className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <KeyRound className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-mono text-sm font-semibold truncate" title={keyName}>
              {keyName}
            </span>
            <Badge variant="outline" className="uppercase text-[10px] bg-amber-500/15 text-amber-500 border-amber-500/30 font-bold">
              HASH ({fields.length} fields)
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

        {/* TTL ve Arama Barı */}
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
              placeholder="Field veya Value ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
          </div>
        </div>
      </CardHeader>

      {/* Tablo İçerik Alanı */}
      <CardContent className="flex-1 p-0 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50 z-10">
            <TableRow className="text-xs">
              <TableHead className="w-[30%]">Field</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-[100px] text-right">Aksiyonlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Yeni Field Ekleme Satırı */}
            {isAdding ? (
              <TableRow className="bg-amber-500/5">
                <TableCell>
                  <Input
                    placeholder="Field Adı"
                    value={newField}
                    onChange={(e) => setNewField(e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Value Değeri"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" onClick={handleAddField} className="h-7 text-xs px-2">
                      Ekle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAdding(false)}
                      className="h-7 text-xs px-2"
                    >
                      İptal
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
                    Yeni Field Ekle
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {/* Field Listesi */}
            {filteredFields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                  Gösterilecek field bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filteredFields.map((item) => {
                const isEdited = editedFields[item.field] !== undefined && editedFields[item.field] !== item.value;
                const isJustSaved = savedField === item.field;

                return (
                  <TableRow key={item.field} className="text-xs group">
                    <TableCell className="font-mono font-medium text-foreground">
                      {item.field}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editedFields[item.field] ?? item.value}
                        onChange={(e) => handleValueChange(item.field, e.target.value)}
                        className={`h-7 text-xs font-mono ${
                          isEdited ? 'border-amber-500 focus-visible:ring-amber-500' : ''
                        }`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEdited && (
                          <Button
                            size="icon"
                            variant="default"
                            onClick={() => handleSaveSingleField(item.field)}
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
                          onClick={() => handleDeleteSingleField(item.field)}
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