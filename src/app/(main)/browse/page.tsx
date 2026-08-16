'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { HeroBanner } from '@/components/content/hero-banner';
import { ContentRow } from '@/components/content/content-row';
import { ContinueWatchingRow } from '@/components/content/continue-watching-row';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Content, Genre, WatchHistory } from '@/types/database';
import toast from 'react-hot-toast';

export default function BrowsePage() {
  const [featured, setFeatured] = useState<Content[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [contentByGenre, setContentByGenre] = useState<Record<string, Content[]>>({});
  const [continueWatching, setContinueWatching] = useState<(WatchHistory & { content: Content })[]>([]);
  const [trending, setTrending] = useState<Content[]>([]);
  const [newReleases, setNewReleases] = useState<Content[]>([]);
  const [mostFinished, setMostFinished] = useState<Content[]>([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState<{ title: string; items: Content[] }>({ title: '', items: [] });
  const [myListIds, setMyListIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    loadContent();
  }, [user]);

  const loadContent = async () => {
    const [
      { data: featuredData },
      { data: genresData },
      { data: allContent },
      { data: newData },
      { data: finishedData },
    ] = await Promise.all([
      supabase.from('content').select('*').eq('is_featured', true).eq('is_published', true).limit(5),
      supabase.from('genres').select('*').order('name'),
      supabase.from('content').select('*').eq('is_published', true).order('created_at', { ascending: false }),
      supabase.from('content').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(20),
      supabase.from('content').select('*').eq('is_published', true).gt('completion_count', 0).order('completion_count', { ascending: false }).limit(20),
    ]);

    setFeatured(featuredData || []);
    setGenres(genresData || []);
    setNewReleases(newData || []);
    setTrending((allContent || []).slice(0, 20));
    setMostFinished(finishedData || []);

    // Each title only appears once across all genre rows, under the first
    // matching genre (genres are already alphabetically ordered), instead
    // of repeating in every genre it's tagged with.
    const byGenre: Record<string, Content[]> = {};
    const alreadyShown = new Set<string>();
    (genresData || []).forEach((genre) => {
      byGenre[genre.id] = (allContent || []).filter((c) => {
        if (!c.genre_ids?.includes(genre.id) || alreadyShown.has(c.id)) return false;
        alreadyShown.add(c.id);
        return true;
      });
    });
    setContentByGenre(byGenre);

    if (user) {
      const [{ data: historyData }, { data: listData }, { data: recentWatch }] = await Promise.all([
        supabase
          .from('watch_history')
          .select('*, content(*)')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('watched_at', { ascending: false })
          .limit(20),
        supabase.from('my_list').select('content_id').eq('user_id', user.id),
        // Most recent thing this user watched anything of, used to seed
        // "Because You Watched X" — simple rule-based recommendation, no AI.
        supabase
          .from('watch_history')
          .select('content_id, content(*)')
          .eq('user_id', user.id)
          .order('watched_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setContinueWatching((historyData as any) || []);
      setMyListIds(new Set((listData || []).map((item) => item.content_id)));

      const seed = (recentWatch as any)?.content as Content | undefined;
      if (seed?.genre_ids?.length) {
        const { data: watchedIds } = await supabase.from('watch_history').select('content_id').eq('user_id', user.id);
        const excludeIds = new Set((watchedIds || []).map((w) => w.content_id));
        const similar = (allContent || []).filter(
          (c) => c.id !== seed.id && !excludeIds.has(c.id) && c.genre_ids?.some((g) => seed.genre_ids.includes(g))
        );
        if (similar.length) setBecauseYouWatched({ title: `Because You Watched ${seed.title.trim()}`, items: similar.slice(0, 20) });
      }
    }

    setLoading(false);
  };

  const toggleList = useCallback(async (contentId: string) => {
    if (!user) return;
    const inList = myListIds.has(contentId);
    if (inList) {
      const { error } = await (supabase as any).from('my_list').delete().eq('user_id', user.id).eq('content_id', contentId);
      if (error) { toast.error('Could not remove from list'); return; }
      setMyListIds((prev) => { const next = new Set(prev); next.delete(contentId); return next; });
      toast.success('Removed from My List');
    } else {
      const { error } = await (supabase as any).from('my_list').insert({ user_id: user.id, content_id: contentId });
      if (error) { toast.error('Could not add to list'); return; }
      setMyListIds((prev) => new Set(prev).add(contentId));
      toast.success('Added to My List');
    }
  }, [user, myListIds, supabase]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <HeroBanner items={featured} />

      {continueWatching.length > 0 && (
        <ContinueWatchingRow items={continueWatching} />
      )}

      <ContentRow title="Trending Now" items={trending} listIds={myListIds} onToggleList={toggleList} />
      <ContentRow title="New Releases" items={newReleases} listIds={myListIds} onToggleList={toggleList} />

      {becauseYouWatched.items.length > 0 && (
        <ContentRow title={becauseYouWatched.title} items={becauseYouWatched.items} listIds={myListIds} onToggleList={toggleList} />
      )}

      {mostFinished.length > 0 && (
        <ContentRow title="Most Finished" items={mostFinished} listIds={myListIds} onToggleList={toggleList} />
      )}

      {genres.map((genre) => {
        const items = contentByGenre[genre.id] || [];
        if (!items.length) return null;
        return (
          <ContentRow
            key={genre.id}
            title={genre.name}
            items={items}
            listIds={myListIds}
            onToggleList={toggleList}
          />
        );
      })}
    </div>
  );
}
