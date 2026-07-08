'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Film, Users, CreditCard, Eye } from 'lucide-react';

interface Stats {
  totalContent: number;
  totalUsers: number;
  activeSubscriptions: number;
  totalMovies: number;
  totalSeries: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalContent: 0, totalUsers: 0, activeSubscriptions: 0, totalMovies: 0, totalSeries: 0 });
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [
      { count: contentCount },
      { count: userCount },
      { count: subCount },
      { count: movieCount },
      { count: seriesCount },
    ] = await Promise.all([
      supabase.from('content').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('content').select('*', { count: 'exact', head: true }).eq('type', 'movie'),
      supabase.from('content').select('*', { count: 'exact', head: true }).eq('type', 'series'),
    ]);
    setStats({
      totalContent: contentCount || 0,
      totalUsers: userCount || 0,
      activeSubscriptions: subCount || 0,
      totalMovies: movieCount || 0,
      totalSeries: seriesCount || 0,
    });
  };

  const cards = [
    { label: 'Total Content', value: stats.totalContent, icon: Film, color: 'text-blue-400' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-green-400' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: CreditCard, color: 'text-yellow-400' },
    { label: 'Movies', value: stats.totalMovies, icon: Film, color: 'text-purple-400' },
    { label: 'Series', value: stats.totalSeries, icon: Eye, color: 'text-pink-400' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
    </div>
  );
}
