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
  const href = content.type === 'movie'
    ? `/watch/${content.slug}`
    : `/title/${content.slug}`;

  return (
    <div className="group relative">
      <Link href={href}>
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-dark-800 shadow-lg ring-1 ring-white/5 transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-primary-900/30">
          {content.poster_url ? (
            <Image
              src={content.poster_url}
              alt={content.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 15vw"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-dark-700 to-dark-900 p-3 text-center">
              <Play className="h-8 w-8 text-dark-500" />
              <span className="text-xs text-dark-400 font-medium leading-tight">{content.title}</span>
            </div>
          )}

          {/* Hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-2 ring-white/25 transition-transform duration-200 group-hover:scale-110">
              <Play className="h-4 w-4 text-white" fill="white" />
            </div>
          </div>

          {/* Type badge */}
          <div className="absolute left-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
            {content.type === 'series' ? 'Series' : 'Film'}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="mt-2.5 flex items-start justify-between gap-1 px-0.5">
        <Link href={href} className="min-w-0 flex-1">
          <h3 className="truncate text-[13px] font-semibold leading-snug text-dark-200 transition-colors group-hover:text-white">
            {content.title}
          </h3>
          <p className="mt-0.5 text-[11px] font-medium text-dark-500">
            {content.release_year}
          </p>
        </Link>
        {onToggleList && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleList(content.id); }}
            className="mt-0.5 flex-shrink-0 rounded-full p-1 text-dark-600 transition-colors hover:text-white"
          >
            {inList
              ? <Check className="h-3.5 w-3.5 text-primary-400" />
              : <Plus className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}