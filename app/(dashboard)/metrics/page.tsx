// app/(dashboard)/metrics/page.tsx
'use client';

import { MetricsDashboard } from '@/components/redis/metrics-dashboard';

export default function MetricsPage() {
  const fetchRealMetrics = async () => {
    const res = await fetch('/api/redis/metrics');
    if (!res.ok) throw new Error('API request failed');
    return res.json();
  };

  return (
    <div className="h-screen w-full bg-background">
      <MetricsDashboard onFetchMetrics={fetchRealMetrics} pollingInterval={2000} />
    </div>
  );
}