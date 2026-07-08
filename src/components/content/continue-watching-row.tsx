'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Content, WatchHistory } from '@/types/database';

interface ContinueWatchingRowProps {
  items: (WatchHistory & { content: Content })[];
}

export function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  if (!items.length) return null;

  return (
    <section className="py-4">
      <h2 className="mb-3 px-4 text-lg font-bold md:px-8 md:text-xl">Continue Watching</h2>
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 md:gap-4 md:px-8" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => {
          const progress = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
          const c = item.content;
          return (
            <Link key={item.id} href={`/watch/${c.slug}`} className="w-[260px] flex-shrink-0 md:w-[320px]">
              <div className="group relative aspect-video overflow-hidden rounded-lg bg-dark-800">
                {c.thumbnail_url ? (
                  <Image src={c.thumbnail_url} alt={c.title} fill className="object-cover" sizes="320px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-dark-500 text-sm">{c.title}</div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded-full bg-white/20 p-3"><Play className="h-6 w-6" fill="white" /></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-700">
                  <div className="h-full bg-primary-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <p className="mt-1 truncate text-sm font-medium">{c.title}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
