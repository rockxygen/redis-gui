// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Key, 
  Activity, 
  Terminal as TerminalIcon, 
  Settings, 
  RefreshCw,
  Server
} from 'lucide-react';

import { KeyExplorerView } from '@/components/redis/key-explorer-view';
import { MetricsDashboard } from '@/components/redis/metrics-dashboard';
import { CliTerminal } from '@/components/redis/cli-terminal';
import { AddKeyModal } from '@/components/redis/add-key-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ActiveTab = 'explorer' | 'metrics' | 'cli';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefreshAll = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* 1. SOL GEZİNTİ BAR (Sidebar Navigation) */}
      <aside className="w-16 flex flex-col items-center py-4 border-r border-border bg-sidebar shrink-0 justify-between z-20">
        <div className="flex flex-col items-center gap-6">
          {/* Proje Logosu */}
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary transition-transform hover:scale-105">
            <Database className="h-5 w-5" />
          </div>

          {/* Sekme İkonları */}
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

        {/* Bağlantı İndikatörü ve Ayarlar */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex items-center justify-center h-3 w-3 relative cursor-pointer"
            title={isConnected ? 'Redis Sunucusuna Bağlı' : 'Bağlantı Kesildi'}
          >
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            ></span>
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* 2. ANA İÇERİK VE HEADER KATMANI */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Üst Bilgi Barı (Top App Bar) */}
        <header className="h-12 border-b border-border bg-background/50 backdrop-blur px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Server className="h-3.5 w-3.5" />
              <span className="font-mono text-foreground font-semibold">127.0.0.1:6379</span>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase font-mono">
              Standalone
            </Badge>
          </div>

          {/* Sağ Üst Aksiyonlar */}
          <div className="flex items-center gap-2">
            {activeTab === 'explorer' && (
              <AddKeyModal onSuccess={handleRefreshAll} />
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefreshAll}
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

          {/* TAB 2: REAL-TIME METRICS */}
          <div className={`h-full w-full ${activeTab === 'metrics' ? 'block' : 'hidden'}`}>
            <MetricsDashboard pollingInterval={2500} />
          </div>

          {/* TAB 3: INTERACTIVE CLI TERMINAL */}
          <div className={`h-full w-full ${activeTab === 'cli' ? 'block' : 'hidden'}`}>
            <CliTerminal />
          </div>
        </main>
      </div>
    </div>
  );
}