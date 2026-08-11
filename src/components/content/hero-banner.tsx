'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Content } from '@/types/database';

interface HeroBannerProps {
  items: Content[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => goTo((current + 1) % items.length), 9000);
    return () => clearInterval(timer);
  }, [items.length, current]);

  const goTo = (index: number) => {
    setFading(true);
    setTimeout(() => { setCurrent(index); setFading(false); }, 300);
  };

  if (!items.length) return null;

  const item = items[current];
  const watchHref = item.type === 'movie' ? `/watch/${item.slug}` : `/series/${item.slug}`;

  return (
    <div className="relative h-[58vh] w-full overflow-hidden md:h-[82vh]">
      {/* Background */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        {(item.backdrop_url || item.poster_url) ? (
          <Image
            src={item.backdrop_url || item.poster_url!}
            alt={item.title}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-dark-800 to-dark-950" />
        )}
      </div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/10 to-dark-950/30" />

      {/* Content */}
      <div className={`absolute bottom-16 left-0 right-0 px-5 transition-all duration-500 md:bottom-28 md:px-10 md:max-w-2xl ${fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded bg-primary-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            {item.type === 'series' ? 'Series' : 'Film'}
          </span>
          {item.rating && (
            <span className="rounded border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white/60">
              {item.rating}
            </span>
          )}
        </div>

        <h1 className="mb-3 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
          {item.title}
        </h1>
        <p className="mb-1 text-xs font-medium text-dark-400">{item.release_year}</p>
        <p className="mb-6 line-clamp-2 max-w-lg text-sm leading-relaxed text-dark-200 md:text-base md:line-clamp-3">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href={watchHref} className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-dark-950 shadow-lg transition-all hover:bg-white/90 hover:scale-105 active:scale-95">
            <Play className="h-4 w-4" fill="currentColor" /> Play Now
          </Link>
          <Link href={`/title/${item.slug}`} className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/20">
            <Info className="h-4 w-4" /> More Info
          </Link>
        </div>
      </div>

      {/* Prev / Next */}
      {items.length > 1 && (
        <>
          <button onClick={() => goTo((current - 1 + items.length) % items.length)} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-sm ring-1 ring-white/10 transition-all hover:bg-black/60 hover:text-white md:left-5">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => goTo((current + 1) % items.length)} className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-sm ring-1 ring-white/10 transition-all hover:bg-black/60 hover:text-white md:right-5">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5 md:bottom-8">
            {items.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-primary-500' : 'w-1.5 bg-white/25 hover:bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}