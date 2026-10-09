// app/(dashboard)/keys/page.tsx
'use client';

import { useState } from 'react';
import { KeyTree } from '@/components/redis/key-tree';
import { KeyValueEditor } from '@/components/redis/key-value-editor';

const MOCK_KEYS = [
  { key: 'user:100:profile', type: 'json' as const },
  { key: 'system:status', type: 'string' as const },
];

const MOCK_DATA: Record<string, { value: string; type: 'string' | 'json'; ttl: number }> = {
  'user:100:profile': {
    value: JSON.stringify({ id: 100, name: 'Ahmet Yılmaz', role: 'admin', active: true }, null, 2),
    type: 'json',
    ttl: 3600,
  },
  'system:status': {
    value: 'MAINTENANCE_MODE_OFF',
    type: 'string',
    ttl: -1,
  },
};

export default function KeysPage() {
  const [selectedKey, setSelectedKey] = useState<string | null>('user:100:profile');
  const [keysData, setKeysData] = useState(MOCK_DATA);

  const currentKeyData = selectedKey ? keysData[selectedKey] : null;

  const handleSave = async (key: string, newValue: string, newTtl: number) => {
    // Burada Server Action veya API Route çağrısı yapılır
    setKeysData((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: newValue, ttl: newTtl },
    }));
    alert('Key başarıyla güncellendi!');
  };

  const handleDelete = async (key: string) => {
    if (confirm(`${key} anahtarını silmek istediğinize emin misiniz?`)) {
      // Server Action veya API çağrısı
      const newKeysData = { ...keysData };
      delete newKeysData[key];
      setKeysData(newKeysData);
      setSelectedKey(null);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sol Panel: Key Tree */}
      <KeyTree
        keys={MOCK_KEYS}
        selectedKey={selectedKey}
        onSelectKey={(key) => setSelectedKey(key)}
      />

      {/* Sağ Panel: Key Value Editor */}
      <div className="flex-1 h-full">
        {selectedKey && currentKeyData ? (
          <KeyValueEditor
            keyName={selectedKey}
            type={currentKeyData.type}
            initialValue={currentKeyData.value}
            initialTtl={currentKeyData.ttl}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Görüntülemek veya düzenlemek için soldan bir key seçin.
          </div>
        )}
      </div>
    </div>
  );
}