// app/(dashboard)/metrics/page.tsx
'use client';

import { MetricsDashboard } from '@/components/redis/metrics-dashboard';

export default function MetricsPage() {
  return (
    <div className="h-screen w-full bg-background">
      <MetricsDashboard />
    </div>
  );
}