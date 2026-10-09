// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Key, 
  Activity, 
  Terminal as TerminalIcon, 
  LogOut, 
  RefreshCw 
} from 'lucide-react';

import { KeyExplorerView } from '@/components/redis/key-explorer-view';
import { MetricsDashboard } from '@/components/redis/metrics-dashboard';
import { CliTerminal } from '@/components/redis/cli-terminal';
import { ConnectionSwitcher } from '@/components/redis/connection-switcher';
import { AddKeyModal } from '@/components/redis/add-key-modal';
import { LoginView } from '@/components/auth/login-view';
import { Button } from '@/components/ui/button';
import { getCheckSessionAction, logoutAction  } from '@/actions/auth';

type ActiveTab = 'explorer' | 'metrics' | 'cli';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const checkAuth = async () => {
    // lib/auth yerine Server Action olan getCheckSessionAction çağrılır
    const session = await getCheckSessionAction();
    if (session && !session.mustChangePassword) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-mono">
        Oturum kontrol ediliyor...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* SOL BAR */}
      <aside className="w-16 flex flex-col items-center py-4 border-r border-border bg-sidebar shrink-0 justify-between z-20">
        <div className="flex flex-col items-center gap-6">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Database className="h-5 w-5" />
          </div>

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
              title="Canlı Metrikler"
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

        {/* Çıkış Yap Butonu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
          title="Oturumu Kapat"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </aside>

      {/* İÇERİK */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-border bg-background/50 backdrop-blur px-4 flex items-center justify-between shrink-0 z-10">
          <ConnectionSwitcher onConnectionChanged={() => setRefreshTrigger((p) => p + 1)} />

          <div className="flex items-center gap-2">
            {activeTab === 'explorer' && (
              <AddKeyModal onSuccess={() => setRefreshTrigger((p) => p + 1)} />
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRefreshTrigger((p) => p + 1)}
              className="h-7 w-7"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <div className={`h-full w-full ${activeTab === 'explorer' ? 'block' : 'hidden'}`}>
            <KeyExplorerView key={refreshTrigger} />
          </div>
          <div className={`h-full w-full ${activeTab === 'metrics' ? 'block' : 'hidden'}`}>
            <MetricsDashboard key={refreshTrigger} pollingInterval={2500} />
          </div>
          <div className={`h-full w-full ${activeTab === 'cli' ? 'block' : 'hidden'}`}>
            <CliTerminal key={refreshTrigger} />
          </div>
        </main>
      </div>
    </div>
  );
}