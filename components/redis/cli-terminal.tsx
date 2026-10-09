// components/redis/cli-terminal.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal as TerminalIcon, Trash2, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { executeCliCommand } from '@/actions/cli';
import { getConnections, getActiveConnectionId } from '@/actions/connections';

interface TerminalLog {
  id: string;
  command: string;
  output?: string;
  error?: string;
  executionTimeMs?: number;
  timestamp: string;
}

const INITIAL_LOGS: TerminalLog[] = [
  {
    id: 'welcome-log',
    command: 'INFO',
    output:
      '# Redis Interactive Shell v1.0.0\nConnected to selected Redis instance.\nType "HELP" or commands like "GET key", "PING", "DBSIZE"...',
    timestamp: 'SYSTEM',
  },
];

export function CliTerminal() {
  const [logs, setLogs] = useState<TerminalLog[]>(INITIAL_LOGS);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeServerInfo, setActiveServerInfo] = useState('Yükleniyor...');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Aktif sunucu bilgisini çeker
  const fetchActiveServer = useCallback(async () => {
    try {
      const list = await getConnections();
      const activeId = await getActiveConnectionId();
      const active = list.find((c) => c.id === activeId) || {
        name: 'Localhost',
        host: '127.0.0.1',
        port: 6379,
      };
      setActiveServerInfo(`${active.name} (${active.host}:${active.port})`);
    } catch {
      setActiveServerInfo('Localhost (127.0.0.1:6379)');
    }
  }, []);

  useEffect(() => {
    fetchActiveServer();
  }, [fetchActiveServer]);

  // Otomatik aşağı kaydırma
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Ctrl+L ile ekran temizleme
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setLogs([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommandSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = input.trim();
    if (!cmd || isExecuting) return;

    setIsExecuting(true);
    setInput('');

    // Geçmişe ekle
    setHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);

    // Sunucuda komutu çalıştır
    const res = await executeCliCommand(cmd);

    if (res.formattedOutput === 'CLEAR_SIGNAL') {
      setLogs([]);
      setIsExecuting(false);
      return;
    }

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLog: TerminalLog = {
      id: Math.random().toString(36).substring(2, 9),
      command: cmd,
      output: res.formattedOutput,
      error: res.error,
      executionTimeMs: res.executionTimeMs,
      timestamp: timeString,
    };

    setLogs((prev) => [...prev, newLog]);
    setIsExecuting(false);
  };

  // Ok tuşlarıyla komut geçmişinde gezinme
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-slate-950 text-slate-100 font-mono text-xs select-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Üst Başlık Çubuğu */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/50 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">Redis CLI Console</span>
          <span className="text-[10px] text-emerald-500/80 font-mono">[{activeServerInfo}]</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">Ctrl + L</kbd> temizler
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLogs([]);
            }}
            className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            title="Ekranı Temizle"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Terminal Günlükleri (Logs) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="space-y-1.5">
            {/* Çalıştırılan Komut Satırı */}
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-emerald-400 font-bold select-none">&gt;</span>
              <span className="text-slate-100 font-semibold">{log.command}</span>
              <span className="text-[10px] text-slate-500 ml-auto select-none">
                {log.executionTimeMs !== undefined ? `${log.executionTimeMs}ms` : log.timestamp}
              </span>
            </div>

            {/* Çıktı / Yanıt Satırı */}
            {log.output && (
              <pre className="whitespace-pre-wrap break-all text-slate-300 pl-4 border-l-2 border-slate-800 font-mono">
                {log.output}
              </pre>
            )}

            {/* Hata Mesajı */}
            {log.error && (
              <div className="text-rose-400 pl-4 border-l-2 border-rose-500/50 bg-rose-500/5 py-1 font-mono">
                (error) {log.error}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Komut Giriş Satırı */}
      <form
        onSubmit={handleCommandSubmit}
        className="flex items-center gap-2 p-3 bg-slate-900 border-t border-slate-800 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-emerald-400 font-bold text-sm select-none">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isExecuting ? 'Komut işleniyor...' : 'Örn: SET user:name "Ahmet" veya GET user:name'}
          disabled={isExecuting}
          className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-600 font-mono text-xs"
          autoFocus
        />
        <Button
          type="submit"
          disabled={isExecuting || !input.trim()}
          size="icon"
          className="h-7 w-7 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-slate-950"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}