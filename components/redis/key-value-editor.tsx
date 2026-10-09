// components/redis/key-value-editor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Save, 
  Trash2, 
  Clock, 
  Copy, 
  Check, 
  FileJson, 
  AlignLeft, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface KeyValueEditorProps {
  keyName: string;
  type: 'string' | 'json';
  initialValue: string;
  initialTtl?: number; // Saniye cinsinden (-1 ise sınırsız)
  onSave: (key: string, value: string, ttl: number) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  isLoading?: boolean;
}

export function KeyValueEditor({
  keyName,
  type,
  initialValue,
  initialTtl = -1,
  onSave,
  onDelete,
  isLoading = false,
}: KeyValueEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [ttl, setTtl] = useState<number>(initialTtl);
  const [copied, setCopied] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Key değiştiğinde state'leri güncelle
  useEffect(() => {
    setValue(initialValue);
    setTtl(initialTtl);
    setJsonError(null);
  }, [keyName, initialValue, initialTtl]);

  // JSON Doğrulama Kontrolü
  const handleEditorChange = (newValue: string | undefined) => {
    const val = newValue || '';
    setValue(val);

    if (type === 'json') {
      try {
        if (val.trim()) {
          JSON.parse(val);
        }
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message || 'Geçersiz JSON formatı');
      }
    }
  };

  // JSON Formatla (Prettify)
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(value);
      setValue(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      // Hata durumunu state zaten yakalıyor
    }
  };

  // Panoya Kopyala
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Kaydetme İşlemi
  const handleSave = async () => {
    if (type === 'json' && jsonError) return;
    setIsSaving(true);
    try {
      await onSave(keyName, value, ttl);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-full flex flex-col border-border bg-background rounded-none border-0 border-l">
      {/* Üst Bar / Key Bilgileri */}
      <CardHeader className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-sm font-semibold truncate text-foreground" title={keyName}>
              {keyName}
            </span>
            <Badge
              variant="outline"
              className={`uppercase text-[10px] px-1.5 py-0 font-bold ${
                type === 'json'
                  ? 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30'
                  : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
              }`}
            >
              {type}
            </Badge>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(keyName)}
              disabled={isLoading || isSaving}
              className="h-8 gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Sil
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading || isSaving || !!jsonError}
              className="h-8 gap-1.5 text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>

        {/* TTL Yapılandırması & Araçlar */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">TTL (Saniye):</span>
            <Input
              type="number"
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              placeholder="-1 (Sonsuz)"
              className="w-28 h-7 text-xs font-mono"
            />
            <span className="text-[11px] text-muted-foreground">
              {ttl === -1 ? '(Süresiz)' : ttl <= 0 ? '(Süresi dolmuş)' : `${ttl}s sonra silinecek`}
            </span>
          </div>

          {type === 'json' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormatJson}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <FileJson className="h-3.5 w-3.5" />
              JSON Formatla
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Monaco Editor Alanı */}
      <CardContent className="flex-1 p-0 relative">
        <Editor
          height="100%"
          language={type === 'json' ? 'json' : 'plaintext'}
          theme="vs-dark"
          value={value}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
          }}
        />

        {/* JSON Sözdizimi Hatası Uyarı Çubuğu */}
        {jsonError && (
          <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-destructive-foreground px-3 py-1.5 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{jsonError}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}