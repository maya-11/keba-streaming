'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info } from 'lucide-react';
import type { Content } from '@/types/database';

interface HeroBannerProps {
  items: Content[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const item = items[current];
  const watchHref = item.type === 'movie' ? `/watch/${item.slug}` : `/series/${item.slug}`;

  return (
    <div className="relative h-[60vh] w-full md:h-[80vh]">
      <div className="absolute inset-0">
        {item.backdrop_url ? (
          <Image src={item.backdrop_url} alt={item.title} fill className="object-cover" priority unoptimized />
        ) : item.poster_url ? (
          <Image src={item.poster_url} alt={item.title} fill className="object-cover" priority unoptimized />
        ) : (
          <div className="h-full w-full bg-dark-900" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent" />

      <div className="absolute bottom-20 left-4 right-4 md:bottom-32 md:left-8 md:max-w-2xl">
        <h1 className="mb-3 text-3xl font-bold md:text-5xl lg:text-6xl">{item.title}</h1>
        <p className="mb-1 text-sm text-dark-300">
          {item.release_year} &middot; {item.rating || 'NR'} &middot; {item.type === 'movie' ? 'Movie' : 'Series'}
        </p>
        <p className="mb-6 line-clamp-3 text-sm text-dark-200 md:text-base">{item.description}</p>
        <div className="flex gap-3">
          <Link href={watchHref} className="btn-primary flex items-center gap-2">
            <Play className="h-5 w-5" fill="white" /> Play
          </Link>
          <Link href={`/title/${item.slug}`} className="btn-secondary flex items-center gap-2">
            <Info className="h-5 w-5" /> More Info
          </Link>
        </div>
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-8 right-4 flex gap-2 md:right-8">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-primary-500' : 'w-4 bg-dark-500'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
