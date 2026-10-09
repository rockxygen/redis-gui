// components/redis/metrics-dashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
  RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface MetricPoint {
  time: string;
  usedMemoryMb: number;
  peakMemoryMb: number;
  opsPerSec: number;
  connectedClients: number;
  hitRate: number;
}

interface MetricsDashboardProps {
  onFetchMetrics?: () => Promise<MetricPoint>;
  pollingInterval?: number; // milisaniye cinsinden (varsayılan 3000ms)
}

// Örnek Metrik Üretici (Gerçek API Route bağlayana kadar mock veri sağlar)
const generateMockMetric = (): MetricPoint => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  return {
    time: timeStr,
    usedMemoryMb: Number((45 + Math.random() * 8).toFixed(2)),
    peakMemoryMb: 64.0,
    opsPerSec: Math.floor(120 + Math.random() * 80),
    connectedClients: Math.floor(12 + Math.random() * 5),
    hitRate: Number((92 + Math.random() * 5).toFixed(1)),
  };
};

export function MetricsDashboard({
  onFetchMetrics,
  pollingInterval = 3000,
}: MetricsDashboardProps) {
  const [data, setData] = useState<MetricPoint[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Veri çekme döngüsü
  useEffect(() => {
    let isMounted = true;

    const fetchLatest = async () => {
      try {
        const newPoint = onFetchMetrics
          ? await onFetchMetrics()
          : generateMockMetric();

        if (isMounted) {
          setData((prev) => {
            const updated = [...prev, newPoint];
            // Grafikte sadece son 20 veri noktasını tut
            return updated.slice(-20);
          });
        }
      } catch (err) {
        console.error('Failed to fetch Redis metrics:', err);
      }
    };

    // İlk yüklemede çalıştır
    fetchLatest();

    if (!isLive) return;

    const interval = setInterval(fetchLatest, pollingInterval);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLive, pollingInterval, onFetchMetrics]);

  const latest = data[data.length - 1] || {
    usedMemoryMb: 0,
    peakMemoryMb: 0,
    opsPerSec: 0,
    connectedClients: 0,
    hitRate: 0,
  };

  return (
    <div className="p-6 space-y-6 bg-background h-full overflow-y-auto">
      {/* Üst Bar / Kontroller */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Redis Real-Time Metrics</h2>
          <Badge
            variant="outline"
            className={`ml-2 font-mono text-[10px] ${
              isLive
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
            }`}
          >
            {isLive ? 'LIVE' : 'PAUSED'}
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

      {/* KPI Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Memory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Used Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{latest.usedMemoryMb} MB</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Peak: {latest.peakMemoryMb} MB
            </p>
          </CardContent>
        </Card>

        {/* Ops / Sec */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Throughput</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{latest.opsPerSec} ops/sec</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Anlık işlenen komut
            </p>
          </CardContent>
        </Card>

        {/* Connected Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Connected Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{latest.connectedClients}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aktif istemci bağlantısı
            </p>
          </CardContent>
        </Card>

        {/* Hit Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Cache Hit Rate</CardTitle>
            <Percent className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">%{latest.hitRate}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Keyspace isabet oranı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafik Alanları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Kullanımı Grafiği */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-emerald-500" />
              Memory Usage (MB)
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
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
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

        {/* Ops / Sec Grafiği */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Commands Per Second (Ops/sec)
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
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
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