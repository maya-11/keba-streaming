'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { History, Play, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Content, WatchHistory } from '@/types/database';

type HistoryRow = WatchHistory & {
  content: Content;
  episodes: { id: string; title: string; episode_number: number } | null;
};

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from('watch_history')
      // !inner drops rows whose content is unpublished/deleted, instead of
      // returning them with content: null and crashing the render below.
      .select('*, content!inner(*), episodes(id, title, episode_number)')
      .eq('user_id', user!.id)
      .order('watched_at', { ascending: false })
      .limit(100);

    if (!error) setHistory((data as any) || []);
    setLoading(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from('watch_history').delete().eq('id', id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const getWatchHref = (item: HistoryRow) => {
    const slug = item.content.slug;
    if (item.episode_id && item.episodes) {
      return `/watch/${slug}?episode=${item.episode_id}`;
    }
    return `/watch/${slug}`;
  };

  const getSubtitle = (item: HistoryRow) => {
    if (item.episodes) {
      return `Episode ${item.episodes.episode_number}: ${item.episodes.title}`;
    }
    return item.content.type === 'movie' ? 'Movie' : 'Series';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Watch History</h1>
        {history.length > 0 && (
          <span className="text-sm text-dark-400">{history.length} item{history.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-20 text-center">
          <History className="mx-auto mb-4 h-16 w-16 text-dark-600" />
          <p className="text-lg text-dark-400">No watch history yet.</p>
          <p className="mt-1 text-sm text-dark-500">Start watching something and it will appear here.</p>
          <Link href="/browse" className="btn-primary mt-6 inline-block">Browse Content</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const c = item.content;
            const progress = item.duration > 0 ? Math.min(100, (item.progress / item.duration) * 100) : 0;
            const imgSrc = c.thumbnail_url || c.poster_url || c.backdrop_url;
            const href = getWatchHref(item);

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg bg-dark-900 p-3 transition-colors hover:bg-dark-800"
              >
                <Link href={href} className="relative aspect-video w-36 flex-shrink-0 overflow-hidden rounded bg-dark-800 md:w-48">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={c.title}
                      fill
                      className="object-cover"
                      sizes="192px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Play className="h-6 w-6 text-dark-500" />
                    </div>
                  )}
                  {/* Progress bar over image */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-700">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/40">
                    <Play className="h-8 w-8 text-white opacity-0 transition-opacity hover:opacity-100" fill="white" />
                  </div>
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={href}>
                    <p className="font-semibold hover:text-primary-400 transition-colors">{c.title}</p>
                  </Link>
                  <p className="text-sm text-dark-400">{getSubtitle(item)}</p>
                  <div className="mt-1 flex items-center gap-3">
                    {item.completed ? (
                      <span className="text-xs font-medium text-green-500">Completed</span>
                    ) : (
                      <span className="text-xs text-dark-400">
                        {Math.round(progress)}% watched
                        {item.duration > 0 && ` · ${formatDuration(item.duration - item.progress)} left`}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-dark-600">
                    {new Date(item.watched_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Link href={href} className="btn-primary flex items-center gap-1 px-3 py-1.5 text-sm">
                    <Play className="h-3 w-3" fill="white" />
                    {item.completed ? 'Replay' : 'Resume'}
                  </Link>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded p-1.5 text-dark-500 hover:text-red-400 transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
