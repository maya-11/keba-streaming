'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, Film, Tv, Tag, Users, CreditCard,
  BarChart3, Star, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/content', icon: Film, label: 'Content' },
  { href: '/admin/genres', icon: Tag, label: 'Genres' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/admin/featured', icon: Star, label: 'Featured' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-dark-900 border-r border-dark-800">
      <div className="flex h-16 items-center px-6">
        <Link href="/admin" className="text-xl font-bold text-primary-500">KEBA Admin</Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-primary-600/10 text-primary-500' : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-dark-800 p-3">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-dark-300 hover:bg-dark-800 hover:text-white">
          <LogOut className="h-5 w-5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="fixed left-4 top-4 z-50 rounded-lg bg-dark-800 p-2 md:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-64">
            {sidebar}
            <button onClick={() => setMobileOpen(false)} className="absolute right-2 top-4">
              <X className="h-5 w-5 text-dark-300" />
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-y-0 left-0 hidden w-64 md:block">
        {sidebar}
      </div>
    </>
  );
}
