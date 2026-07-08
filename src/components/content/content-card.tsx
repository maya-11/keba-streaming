'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, Check } from 'lucide-react';
import type { Content } from '@/types/database';

interface ContentCardProps {
  content: Content;
  inList?: boolean;
  onToggleList?: (contentId: string) => void;
}

export function ContentCard({ content, inList, onToggleList }: ContentCardProps) {
  // Movies go straight to watch, series go to the title detail page to pick episode
  const href = content.type === 'movie'
    ? `/watch/${content.slug}`
    : `/title/${content.slug}`;

  return (
    <div className="content-card group">
      <Link href={href}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-dark-800">
          {content.poster_url ? (
            <Image
              src={content.poster_url}
              alt={content.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-dark-800 text-dark-500 p-2 text-center">
              <span className="text-sm">{content.title}</span>
            </div>
          )}
          <div className="gradient-overlay opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
              <Play className="h-6 w-6 text-white" fill="white" />
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <Link href={href} className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium hover:text-primary-400">{content.title}</h3>
          <p className="text-xs text-dark-400">
            {content.release_year} &middot; {content.type === 'movie' ? 'Movie' : 'Series'}
          </p>
        </Link>
        {onToggleList && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleList(content.id); }}
            className="ml-2 rounded-full p-1 text-dark-400 hover:text-white"
          >
            {inList ? <Check className="h-4 w-4 text-primary-500" /> : <Plus className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
