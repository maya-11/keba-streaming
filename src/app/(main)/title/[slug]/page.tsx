'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, Check, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Content, Season, Episode, Genre } from '@/types/database';
import toast from 'react-hot-toast';

export default function TitlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [content, setContent] = useState<Content | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    const { data } = await supabase
      .from('content')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (!data) { router.push('/browse'); return; }
    setContent(data);

    const { data: genresData } = await supabase.from('genres').select('*');
    setGenres(genresData || []);

    if (data.type === 'series') {
      const { data: seasonsData } = await supabase
        .from('seasons')
        .select('*')
        .eq('content_id', data.id)
        .order('season_number');
      setSeasons(seasonsData || []);
      if (seasonsData?.length) {
        setSelectedSeason(seasonsData[0].id);
        const { data: episodesData } = await supabase
          .from('episodes')
          .select('*')
          .eq('season_id', seasonsData[0].id)
          .order('episode_number');
        setEpisodes(episodesData || []);
      }
    }

    if (user) {
      const { data: listItem } = await supabase
        .from('my_list')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', data.id)
        .single();
      setInList(!!listItem);
    }

    setLoading(false);
  };

  const loadEpisodes = async (seasonId: string) => {
    setSelectedSeason(seasonId);
    const { data } = await supabase
      .from('episodes')
      .select('*')
      .eq('season_id', seasonId)
      .order('episode_number');
    setEpisodes(data || []);
  };

  const toggleList = async () => {
    if (!user || !content) return;
    if (inList) {
      const { error } = await (supabase as any).from('my_list').delete().eq('user_id', user.id).eq('content_id', content.id);
      if (error) { toast.error('Could not remove from list'); return; }
      setInList(false);
      toast.success('Removed from My List');
    } else {
      const { error } = await (supabase as any).from('my_list').insert({ user_id: user.id, content_id: content.id });
      if (error) { toast.error('Could not add to list'); return; }
      setInList(true);
      toast.success('Added to My List');
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!content) return null;

  const contentGenres = genres.filter((g) => content.genre_ids?.includes(g.id));
  const hasPlayableEpisode = content.type === 'movie' || !!episodes[0];
  const watchHref = content.type === 'movie' ? `/watch/${content.slug}` : episodes[0] ? `/watch/${content.slug}?episode=${episodes[0].id}` : '#';

  return (
    <div>
      <div className="relative h-[50vh] md:h-[60vh]">
        {content.backdrop_url ? (
          <Image src={content.backdrop_url} alt={content.title} fill className="object-cover" priority />
        ) : content.poster_url ? (
          <Image src={content.poster_url} alt={content.title} fill className="object-cover" priority />
        ) : (
          <div className="h-full bg-dark-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 -mt-32 relative z-10 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row">
          {content.poster_url && (
            <div className="hidden md:block w-[200px] flex-shrink-0">
              <Image src={content.poster_url} alt={content.title} width={200} height={300} className="rounded-lg shadow-2xl" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">{content.title}</h1>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-dark-300">
              <span>{content.release_year}</span>
              {content.rating && <span className="rounded border border-dark-600 px-1.5 py-0.5">{content.rating}</span>}
              {content.duration && <span>{Math.floor(content.duration / 60)}h {content.duration % 60}m</span>}
              <span>{content.type === 'movie' ? 'Movie' : 'Series'}</span>
            </div>
            {contentGenres.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {contentGenres.map((g) => (
                  <span key={g.id} className="rounded-full bg-dark-800 px-3 py-1 text-xs text-dark-300">{g.name}</span>
                ))}
              </div>
            )}
            <p className="mb-6 text-dark-200">{content.description}</p>
            <div className="flex gap-3">
              {hasPlayableEpisode ? (
                <Link href={watchHref} className="btn-primary flex items-center gap-2">
                  <Play className="h-5 w-5" fill="white" /> Play
                </Link>
              ) : (
                <button
                  disabled
                  className="btn-primary flex cursor-not-allowed items-center gap-2 opacity-50"
                  title="Video coming soon"
                >
                  <Play className="h-5 w-5" fill="white" /> Coming Soon
                </button>
              )}
              <button onClick={toggleList} className="btn-secondary flex items-center gap-2">
                {inList ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {inList ? 'In My List' : 'My List'}
              </button>
            </div>
          </div>
        </div>

        {content.type === 'series' && seasons.length > 0 && (
          <div className="mt-12">
            <div className="mb-4 flex items-center gap-4">
              <h2 className="text-2xl font-bold">Episodes</h2>
              <select
                value={selectedSeason}
                onChange={(e) => loadEpisodes(e.target.value)}
                className="rounded-lg bg-dark-800 px-3 py-2 text-sm"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>Season {s.season_number}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/watch/${content.slug}?episode=${ep.id}`}
                  className="flex items-center gap-4 rounded-lg bg-dark-900 p-4 transition-colors hover:bg-dark-800"
                >
                  <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded bg-dark-800">
                    {ep.thumbnail_url ? (
                      <Image src={ep.thumbnail_url} alt={ep.title} fill className="object-cover" sizes="160px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-dark-500"><Play className="h-6 w-6" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{ep.episode_number}. {ep.title}</p>
                    {ep.description && <p className="mt-1 text-sm text-dark-400 line-clamp-2">{ep.description}</p>}
                    <p className="mt-1 text-xs text-dark-500">{Math.floor(ep.duration / 60)}m</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
