// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Activity, 
  Key, 
  Terminal as TerminalIcon, 
  Settings, 
  Server, 
  Search, 
  ShieldAlert, 
  Sparkles 
} from 'lucide-react';

import { KeyTree } from '@/components/redis/key-tree';
import { KeyValueEditor } from '@/components/redis/key-value-editor';
import { HashEditor } from '@/components/redis/hash-editor';
import { ListEditor } from '@/components/redis/list-editor';
import { MetricsDashboard } from '@/components/redis/metrics-dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { CliTerminal } from '@/components/redis/cli-terminal';

import { getRedisKeys, getKeyValue, deleteRedisKey } from '@/actions/redis'

// Örnek Test Verileri
const MOCK_KEYS = [
  { key: 'user:100:profile', type: 'json' as const },
  { key: 'user:100:settings', type: 'json' as const },
  { key: 'user:101:profile', type: 'hash' as const },
  { key: 'session:tokens:active', type: 'string' as const },
  { key: 'queue:notifications', type: 'list' as const },
  { key: 'system:status', type: 'string' as const },
];

const MOCK_KEY_DATA: Record<string, { type: 'json' | 'string' | 'hash' | 'list'; data: any; ttl: number }> = {
  'user:100:profile': {
    type: 'json',
    data: JSON.stringify({ id: 100, name: 'Ahmet Yılmaz', email: 'ahmet@example.com', role: 'admin' }, null, 2),
    ttl: 3600,
  },
  'user:100:settings': {
    type: 'json',
    data: JSON.stringify({ theme: 'dark', notifications: true, lang: 'tr' }, null, 2),
    ttl: -1,
  },
  'user:101:profile': {
    type: 'hash',
    data: [
      { field: 'name', value: 'Mehmet Demir' },
      { field: 'email', value: 'mehmet@example.com' },
      { field: 'role', value: 'user' },
    ],
    ttl: 7200,
  },
  'session:tokens:active': {
    type: 'string',
    data: 'bearer_token_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    ttl: 1800,
  },
  'queue:notifications': {
    type: 'list',
    data: ['send_welcome_email:100', 'push_notification:101', 'generate_invoice:99'],
    ttl: -1,
  },
  'system:status': {
    type: 'string',
    data: 'OPERATIONAL',
    ttl: -1,
  },
};

type ActiveTab = 'explorer' | 'metrics' | 'cli';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [selectedKey, setSelectedKey] = useState<string | null>('user:100:profile');
  const [keysData, setKeysData] = useState(MOCK_KEY_DATA);

  const [keys, setKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await getRedisKeys('*', 200);
      setKeys(res.keys);
    } catch (err) {
      console.error('Redis baglanti hatasi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const currentKeyObj = selectedKey ? keysData[selectedKey] : null;

  // Key Güncelleme Handler
  const handleSaveKey = async (key: string, val: any, newTtl: number) => {
    setKeysData((prev) => ({
      ...prev,
      [key]: { ...prev[key], data: val, ttl: newTtl },
    }));
  };

  // Key Silme Handler
  const handleDeleteKey = async (key: string) => {
    if (confirm(`"${key}" anahtarını silmek istediğinize emin misiniz?`)) {
      const updated = { ...keysData };
      delete updated[key];
      setKeysData(updated);
      setSelectedKey(null);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* 1. SOL GEZİNTİ BAR (Main Navigation Sidebar) */}
      <aside className="w-16 flex flex-col items-center py-4 border-r border-border bg-sidebar shrink-0 justify-between">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Database className="h-6 w-6" />
          </div>

          {/* Menü İkonları */}
          <nav className="flex flex-col gap-2">
            <Button
              variant={activeTab === 'explorer' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => setActiveTab('explorer')}
              title="Key Explorer"
            >
              <Key className="h-5 w-5" />
            </Button>

            <Button
              variant={activeTab === 'metrics' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => setActiveTab('metrics')}
              title="Real-time Metrics"
            >
              <Activity className="h-5 w-5" />
            </Button>

            <Button
              variant={activeTab === 'cli' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => setActiveTab('cli')}
              title="Redis CLI Terminal"
            >
              <TerminalIcon className="h-5 w-5" />
            </Button>
          </nav>
        </div>

        {/* Bağlantı Durumu & Ayarlar */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center h-3 w-3 relative" title="Connected to Redis Localhost">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* 2. DİNAMİK İÇERİK ALANI */}
      <div className="flex-1 flex overflow-hidden">
        {/* TAB 1: KEY EXPLORER */}
        {activeTab === 'explorer' && (
          <>
            {/* Sol Ağaç Paneli */}
            <KeyTree
              keys={Object.keys(keysData).map((k) => ({ key: k, type: keysData[k].type }))}
              selectedKey={selectedKey}
              onSelectKey={(k) => setSelectedKey(k)}
              onRefresh={() => console.log('Refreshed')}
              onAddKey={() => console.log('Add key modal')}
            />

            {/* Sağ Editor Alanı */}
            <main className="flex-1 h-full overflow-hidden">
              {selectedKey && currentKeyObj ? (
                <>
                  {(currentKeyObj.type === 'string' || currentKeyObj.type === 'json') && (
                    <KeyValueEditor
                      keyName={selectedKey}
                      type={currentKeyObj.type}
                      initialValue={currentKeyObj.data}
                      initialTtl={currentKeyObj.ttl}
                      onSave={async (k, val, ttl) => handleSaveKey(k, val, ttl)}
                      onDelete={handleDeleteKey}
                    />
                  )}

                  {currentKeyObj.type === 'hash' && (
                    <HashEditor
                      keyName={selectedKey}
                      initialFields={currentKeyObj.data}
                      initialTtl={currentKeyObj.ttl}
                      onSaveField={async (f, v) => console.log('HSET:', f, v)}
                      onDeleteField={async (f) => console.log('HDEL:', f)}
                      onDeleteKey={handleDeleteKey}
                      onUpdateTtl={async (t) => console.log('EXPIRE:', t)}
                    />
                  )}

                  {currentKeyObj.type === 'list' && (
                    <ListEditor
                      keyName={selectedKey}
                      initialItems={currentKeyObj.data}
                      initialTtl={currentKeyObj.ttl}
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
                  <p className="text-sm font-medium">Görüntülemek veya düzenlemek için sol taraftan bir key seçin.</p>
                </div>
              )}
            </main>
          </>
        )}

        {/* TAB 2: METRICS DASHBOARD */}
        {activeTab === 'metrics' && (
          <main className="flex-1 h-full overflow-hidden">
            <MetricsDashboard pollingInterval={2000} />
          </main>
        )}

        {/* TAB 3: CLI TERMINAL (Placeholder) */}
        {activeTab === 'cli' && (
          <main className="flex-1 h-full overflow-hidden">
            <CliTerminal />
          </main>
        )}
      </div>
    </div>
  );
}