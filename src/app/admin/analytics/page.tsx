'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Film, Eye, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  newUsersThisMonth: number;
  totalWatches: number;
  activeSubscribers: number;
  topContent: { title: string; views: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0, newUsersThisMonth: 0, totalWatches: 0, activeSubscribers: 0, topContent: [],
  });
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      { count: totalUsers },
      { count: newUsers },
      { count: totalWatches },
      { count: activeSubs },
      { data: watchData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
      supabase.from('watch_history').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('watch_history').select('content_id, content(title)').limit(100),
    ]);

    const contentCounts: Record<string, { title: string; views: number }> = {};
    (watchData || []).forEach((w: any) => {
      const id = w.content_id;
      if (!contentCounts[id]) contentCounts[id] = { title: w.content?.title || 'Unknown', views: 0 };
      contentCounts[id].views++;
    });
    const topContent = Object.values(contentCounts).sort((a, b) => b.views - a.views).slice(0, 10);

    setData({
      totalUsers: totalUsers || 0,
      newUsersThisMonth: newUsers || 0,
      totalWatches: totalWatches || 0,
      activeSubscribers: activeSubs || 0,
      topContent,
    });
  };

  const cards = [
    { label: 'Total Users', value: data.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'New This Month', value: data.newUsersThisMonth, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Total Watches', value: data.totalWatches, icon: Eye, color: 'text-purple-400' },
    { label: 'Active Subscribers', value: data.activeSubscribers, icon: Film, color: 'text-yellow-400' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Analytics</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">{card.label}</p>
                <p className="mt-1 text-2xl font-bold">{card.value}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">Most Watched Content</h2>
        {data.topContent.length === 0 ? (
          <p className="text-dark-400">No data yet</p>
        ) : (
          <div className="space-y-3">
            {data.topContent.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-right text-sm text-dark-400">{i + 1}</span>
                  <span className="font-medium">{item.title}</span>
                </div>
                <span className="text-sm text-dark-400">{item.views} views</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
