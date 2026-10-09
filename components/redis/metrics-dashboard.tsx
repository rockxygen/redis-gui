// components/redis/metrics-dashboard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  Activity, 
  HardDrive, 
  Users, 
  Zap, 
  Percent, 
  Play, 
  Pause, 
  Key, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRealtimeMetrics, MetricPoint } from '@/actions/metrics';

interface MetricsDashboardProps {
  pollingInterval?: number; // ms cinsinden (varsayılan 2500ms)
}

export function MetricsDashboard({ pollingInterval = 2500 }: MetricsDashboardProps) {
  const [data, setData] = useState<MetricPoint[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const newPoint = await getRealtimeMetrics();
      setError(null);
      setData((prev) => {
        const updated = [...prev, newPoint];
        // Grafikte kaydırma kolaylığı için sadece son 20 zaman noktasını tut
        return updated.slice(-20);
      });
    } catch (err: any) {
      setError(err.message || 'Metrikler çekilirken bağlantı hatası oluştu.');
    }
  }, []);

  useEffect(() => {
    // Sayfa açıldığında ilk veri çekimini yap
    fetchMetrics();

    if (!isLive) return;

    const timer = setInterval(() => {
      fetchMetrics();
    }, pollingInterval);

    return () => clearInterval(timer);
  }, [isLive, pollingInterval, fetchMetrics]);

  const latest = data[data.length - 1] || {
    usedMemoryMb: 0,
    peakMemoryMb: 0,
    opsPerSec: 0,
    connectedClients: 0,
    hitRate: 0,
    totalKeys: 0,
    uptimeInDays: 0,
  };

  return (
    <div className="p-6 space-y-6 bg-background h-full overflow-y-auto">
      {/* Üst Bar Kontrolleri */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Real-Time Server Metrics</h2>
          <Badge
            variant="outline"
            className={`ml-2 font-mono text-[10px] ${
              isLive
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
            }`}
          >
            {isLive ? 'LIVE POLLING' : 'PAUSED'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="h-8 text-xs gap-1.5"
          >
            {isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isLive ? 'Durdur' : 'Canlıya Al'}
          </Button>
        </div>
      </div>

      {/* Hata Durumu Uyarısı */}
      {error && (
        <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-lg text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Özet KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Used Memory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Used Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold font-mono">{latest.usedMemoryMb} MB</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Peak: {latest.peakMemoryMb} MB
            </p>
          </CardContent>
        </Card>

        {/* Ops / Sec */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Throughput</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold font-mono">{latest.opsPerSec} ops/sec</div>
            <p className="text-[10px] text-muted-foreground mt-1">Anlık işlenen komut</p>
          </CardContent>
        </Card>

        {/* Connected Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold font-mono">{latest.connectedClients}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Aktif soket bağlantısı</p>
          </CardContent>
        </Card>

        {/* Hit Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Hit Rate</CardTitle>
            <Percent className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold font-mono">%{latest.hitRate}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Keyspace isabet oranı</p>
          </CardContent>
        </Card>

        {/* Total Keys & Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Keys</CardTitle>
            <Key className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold font-mono">{latest.totalKeys}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Uptime: {latest.uptimeInDays} gün
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Kullanım Alan Grafiği */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-emerald-500" />
              Memory Usage Trend (MB)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="memoryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="usedMemoryMb"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#memoryGrad)"
                  name="Used Memory (MB)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ops / Sec Çizgi Grafiği */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Throughput (Commands / sec)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="opsPerSec"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="Ops/sec"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}