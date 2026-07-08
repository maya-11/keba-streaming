'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <section className="py-4">
      <div className="mb-3 flex items-center justify-between px-4 md:px-8">
        <h2 className="text-lg font-bold md:text-xl">{title}</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="rounded-full bg-dark-800 p-1.5 hover:bg-dark-700">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll('right')} className="rounded-full bg-dark-800 p-1.5 hover:bg-dark-700">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide md:gap-4 md:px-8"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((item) => (
          <div key={item.id} className="w-[140px] flex-shrink-0 md:w-[180px] lg:w-[200px]">
            <ContentCard content={item} inList={listIds?.has(item.id)} onToggleList={onToggleList} />
          </div>
        ))}
      </div>
    </section>
  );
}
