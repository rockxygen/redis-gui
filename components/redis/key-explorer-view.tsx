// components/redis/key-explorer-view.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { KeyTree } from '@/components/redis/key-tree';
import { KeyValueEditor } from '@/components/redis/key-value-editor';
import { HashEditor } from '@/components/redis/hash-editor';
import { ListEditor } from '@/components/redis/list-editor';
import { 
  getRedisKeys, 
  getKeyValue, 
  setKeyValue, 
  deleteRedisKey, 
  RedisKeyItem 
} from '@/actions/redis';
import { Search, Loader2 } from 'lucide-react';

export function KeyExplorerView() {
  const [keys, setKeys] = useState<RedisKeyItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeKeyData, setActiveKeyData] = useState<{
    data: any;
    ttl: number;
    type: RedisKeyItem['type'];
  } | null>(null);

  const normalizeKeyType = useCallback((type?: RedisKeyItem['type']) => {
    if (type && type !== 'unknown') return type;
    return 'string';
  }, []);

  const normalizedKeys = keys.map((key) => ({
    ...key,
    type: normalizeKeyType(key.type),
  }));

  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isLoadingValue, setIsLoadingValue] = useState(false);

  // 1. Redis Key Listesini Sunucudan Çek
  const fetchKeys = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const res = await getRedisKeys('*', 300);
      setKeys(res.keys);
    } catch (err: any) {
      console.error('Keys çekilirken hata:', err);
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // 2. Seçilen Key'in Değerini Sunucudan Çek
  const handleSelectKey = async (keyName: string) => {
    setSelectedKey(keyName);
    const targetKey = keys.find((k) => k.key === keyName);
    const keyType = targetKey?.type || 'string';

    setIsLoadingValue(true);
    try {
      const res = await getKeyValue(keyName, keyType);
      setActiveKeyData({
        data: res.data,
        ttl: res.ttl,
        type: keyType,
      });
    } catch (err: any) {
      console.error('Value çekilirken hata:', err);
      setActiveKeyData(null);
    } finally {
      setIsLoadingValue(false);
    }
  };

  // 3. String / JSON Kaydetme
  const handleSaveKeyValue = async (key: string, val: string, ttl: number) => {
    if (!activeKeyData) return;
    await setKeyValue(key, val, activeKeyData.type, ttl);
    setActiveKeyData((prev) => (prev ? { ...prev, data: val, ttl } : null));
  };

  // 4. Key Silme
  const handleDeleteKey = async (keyName: string) => {
    if (confirm(`"${keyName}" anahtarını silmek istediğinize emin misiniz?`)) {
      await deleteRedisKey(keyName);
      setSelectedKey(null);
      setActiveKeyData(null);
      await fetchKeys();
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Sol Panel: Key Tree */}
      <KeyTree
        keys={keys}
        selectedKey={selectedKey}
        onSelectKey={handleSelectKey}
        onRefresh={fetchKeys}
        isLoading={isLoadingKeys}
      />

      {/* Sağ Panel: Data Editor */}
      <main className="flex-1 h-full overflow-hidden relative">
        {isLoadingValue ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Anahtar verisi yükleniyor...</span>
          </div>
        ) : selectedKey && activeKeyData ? (
          <>
            {(activeKeyData.type === 'string' || activeKeyData.type === 'json') && (
              <KeyValueEditor
                keyName={selectedKey}
                type={activeKeyData.type}
                initialValue={
                  typeof activeKeyData.data === 'string'
                    ? activeKeyData.data
                    : JSON.stringify(activeKeyData.data, null, 2)
                }
                initialTtl={activeKeyData.ttl}
                onSave={handleSaveKeyValue}
                onDelete={handleDeleteKey}
              />
            )}

            {activeKeyData.type === 'hash' && (
              <HashEditor
                keyName={selectedKey}
                initialFields={activeKeyData.data}
                initialTtl={activeKeyData.ttl}
                onSaveField={async (f, v) => console.log('HSET:', f, v)}
                onDeleteField={async (f) => console.log('HDEL:', f)}
                onDeleteKey={handleDeleteKey}
                onUpdateTtl={async (t) => console.log('EXPIRE:', t)}
              />
            )}

            {activeKeyData.type === 'list' && (
              <ListEditor
                keyName={selectedKey}
                initialItems={activeKeyData.data}
                initialTtl={activeKeyData.ttl}
                onPushItem={async (v, p) => console.log('PUSH:', v, p)}
                onSetIndex={async (i, v) => console.log('LSET:', i, v)}
                onRemoveIndex={async (i) => console.log('LREM:', i)}
                onDeleteKey={handleDeleteKey}
                onUpdateTtl={async (t) => console.log('EXPIRE:', t)}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-6">
            <div className="p-4 bg-muted/40 rounded-full">
              <Search className="h-8 w-8 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium">
              Görüntülemek veya düzenlemek için sol taraftan bir key seçin.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}