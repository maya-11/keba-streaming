'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ContentCard } from './content-card';
import type { Content } from '@/types/database';

interface ContentRowProps {
  title: string;
  items: Content[];
  listIds?: Set<string>;
  onToggleList?: (contentId: string) => void;
}

export function ContentRow({ title, items, listIds, onToggleList }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <section className="group/row py-6">
      {/* Row header */}
      <div className="mb-4 flex items-center justify-between px-4 md:px-10">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold tracking-tight text-white md:text-lg">{title}</h2>
          <ArrowRight className="h-4 w-4 text-primary-500 opacity-0 transition-all duration-200 group-hover/row:opacity-100 group-hover/row:translate-x-1" />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-800/80 text-dark-300 ring-1 ring-white/10 transition-all hover:bg-dark-700 hover:text-white hover:ring-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-800/80 text-dark-300 ring-1 ring-white/10 transition-all hover:bg-dark-700 hover:text-white hover:ring-white/20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2 md:gap-4 md:px-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <div key={item.id} className="w-[145px] flex-shrink-0 md:w-[175px] lg:w-[195px]">
            <ContentCard
              content={item}
              inList={listIds?.has(item.id)}
              onToggleList={onToggleList}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
