// app/page.tsx
'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Key, 
  Activity, 
  Terminal as TerminalIcon, 
  Settings, 
  RefreshCw 
} from 'lucide-react';

import { KeyExplorerView } from '@/components/redis/key-explorer-view';
import { MetricsDashboard } from '@/components/redis/metrics-dashboard';
import { CliTerminal } from '@/components/redis/cli-terminal';
import { ConnectionSwitcher } from '@/components/redis/connection-switcher';
import { AddKeyModal } from '@/components/redis/add-key-modal';
import { Button } from '@/components/ui/button';

type ActiveTab = 'explorer' | 'metrics' | 'cli';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Sunucu değiştiğinde veya manuel yenilemede tüm bileşenleri re-fetch ettirir
  const handleServerOrDataChanged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* 1. SOL GEZİNTİ BAR (Sidebar Navigation) */}
      <aside className="w-16 flex flex-col items-center py-4 border-r border-border bg-sidebar shrink-0 justify-between z-20">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary transition-transform hover:scale-105">
            <Database className="h-5 w-5" />
          </div>

          {/* Sekmeler */}
          <nav className="flex flex-col gap-2">
            <Button
              variant={activeTab === 'explorer' ? 'secondary' : 'ghost'}
              size="icon"
              className={`h-10 w-10 rounded-lg transition-colors ${
                activeTab === 'explorer' ? 'bg-secondary text-foreground' : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab('explorer')}
              title="Key Explorer"
            >
              <Key className="h-5 w-5" />
            </Button>

            <Button
              variant={activeTab === 'metrics' ? 'secondary' : 'ghost'}
              size="icon"
              className={`h-10 w-10 rounded-lg transition-colors ${
                activeTab === 'metrics' ? 'bg-secondary text-foreground' : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab('metrics')}
              title="Canlı Metrikler"
            >
              <Activity className="h-5 w-5" />
            </Button>

            <Button
              variant={activeTab === 'cli' ? 'secondary' : 'ghost'}
              size="icon"
              className={`h-10 w-10 rounded-lg transition-colors ${
                activeTab === 'cli' ? 'bg-secondary text-foreground' : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab('cli')}
              title="Redis CLI Terminal"
            >
              <TerminalIcon className="h-5 w-5" />
            </Button>
          </nav>
        </div>

        {/* Ayarlar İkonu */}
        <div className="flex flex-col items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* 2. ANA İÇERİK ALANI */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Üst Bar (Top App Bar) */}
        <header className="h-12 border-b border-border bg-background/50 backdrop-blur px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* SUNUCU SEÇİCİ BİLEŞENİ */}
            <ConnectionSwitcher onConnectionChanged={handleServerOrDataChanged} />
          </div>

          {/* Sağ Aksiyonlar */}
          <div className="flex items-center gap-2">
            {activeTab === 'explorer' && (
              <AddKeyModal onSuccess={handleServerOrDataChanged} />
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={handleServerOrDataChanged}
              className="h-7 w-7"
              title="Yenile"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        {/* Tab İçerik Alanı */}
        <main className="flex-1 overflow-hidden relative">
          {/* TAB 1: KEY EXPLORER */}
          <div className={`h-full w-full ${activeTab === 'explorer' ? 'block' : 'hidden'}`}>
            <KeyExplorerView key={refreshTrigger} />
          </div>

          {/* TAB 2: METRICS DASHBOARD */}
          <div className={`h-full w-full ${activeTab === 'metrics' ? 'block' : 'hidden'}`}>
            <MetricsDashboard key={refreshTrigger} pollingInterval={2500} />
          </div>

          {/* TAB 3: CLI TERMINAL */}
          <div className={`h-full w-full ${activeTab === 'cli' ? 'block' : 'hidden'}`}>
            <CliTerminal key={refreshTrigger} />
          </div>
        </main>
      </div>
    </div>
  );
}