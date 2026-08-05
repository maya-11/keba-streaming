'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Menu, X, User, LogOut, Heart, History } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const navLinks = [
    { href: '/browse', label: 'Home' },
    { href: '/browse/movies', label: 'Movies' },
    { href: '/browse/series', label: 'Series' },
    { href: '/my-list', label: 'My List' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <nav className="fixed top-0 z-40 w-full bg-gradient-to-b from-dark-950/90 to-transparent backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/browse" className="flex items-center">
            <Image src="/keba-logo.jpg" alt="Keba Entertainmentz" width={48} height={48} className="rounded-sm object-contain" priority />
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href ? 'text-white' : 'text-dark-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles..."
                className="w-48 rounded-lg bg-dark-800 px-3 py-1.5 text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-primary-500 md:w-64"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="ml-2 text-dark-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="text-dark-300 hover:text-white">
              <Search className="h-5 w-5" />
            </button>
          )}

          <Link href="/notifications" className="hidden text-dark-300 hover:text-white md:block">
            <Bell className="h-5 w-5" />
          </Link>

          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold"
            >
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-10 w-48 rounded-lg border border-dark-700 bg-dark-900 py-2 shadow-xl">
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-dark-800" onClick={() => setProfileMenuOpen(false)}>
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link href="/my-list" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-dark-800" onClick={() => setProfileMenuOpen(false)}>
                  <Heart className="h-4 w-4" /> My List
                </Link>
                <Link href="/history" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-dark-800" onClick={() => setProfileMenuOpen(false)}>
                  <History className="h-4 w-4" /> Watch History
                </Link>
                {profile?.role === 'admin' && (
                  <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-primary-400 hover:bg-dark-800" onClick={() => setProfileMenuOpen(false)}>
                    Admin Panel
                  </Link>
                )}
                <hr className="my-1 border-dark-700" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-dark-800">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="text-dark-300 hover:text-white md:hidden">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-dark-800 bg-dark-950/95 backdrop-blur-sm md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-dark-300 hover:bg-dark-800 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
