// components/redis/connection-status-modal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, Server, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { checkRedisHealth } from '@/actions/health';

interface ConnectionStatusModalProps {
  checkIntervalMs?: number; // Varsayılan 3000ms (3 saniye)
}

export function ConnectionStatusModal({ checkIntervalMs = 3000 }: ConnectionStatusModalProps) {
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const performHealthCheck = useCallback(async () => {
    setIsRetrying(true);
    const health = await checkRedisHealth();
    setIsRetrying(false);

    if (!health.isAlive) {
      setIsDisconnected(true);
      setRetryCount((prev) => prev + 1);
    } else {
      setIsDisconnected(false);
      setRetryCount(0);
    }
  }, []);

  useEffect(() => {
    // Sayfa açıldığında periyodik kontrol başlatılır
    const interval = setInterval(() => {
      performHealthCheck();
    }, checkIntervalMs);

    return () => clearInterval(interval);
  }, [checkIntervalMs, performHealthCheck]);

  return (
    <Dialog open={isDisconnected} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md bg-slate-950 border-rose-950/50 text-slate-100 p-6 z-[200] [&>button]:hidden select-none"
      >
        <DialogTitle className="sr-only">Sunucu Bağlantı Durumu</DialogTitle>
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-2">
          {/* Animasyonlu İkon Alanı */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-500 relative z-10">
              <WifiOff className="h-8 w-8" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold tracking-tight text-slate-100 flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              Redis Sunucu Bağlantısı Koptu
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Aktif Redis sunucusu ile iletişim kesildi. Otomatik olarak yeniden bağlanmaya çalışılıyor...
            </p>
          </div>

          {/* Durum Göstergesi & Retry Sayacı */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-slate-500" /> Durum:
              </span>
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                Yeniden Bağlanılıyor (#{retryCount})
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-2">
              <span>Otomatik Kontrol:</span>
              <span className="text-slate-300">Her {checkIntervalMs / 1000} saniyede bir</span>
            </div>
          </div>

          {/* Manuel Tekrar Denede Butonu */}
          <Button
            onClick={performHealthCheck}
            disabled={isRetrying}
            className="w-full h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white gap-2 mt-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Bağlantı Kontrol Ediliyor...' : 'Şimdi Yeniden Bağlanmayı Deneyin'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}