'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { ContentCard } from '@/components/content/content-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Content, Genre } from '@/types/database';
import toast from 'react-hot-toast';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Content[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [myListIds, setMyListIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const [{ data: moviesData }, { data: genresData }] = await Promise.all([
      (supabase as any).from('content').select('*').eq('type', 'movie').eq('is_published', true).order('created_at', { ascending: false }),
      (supabase as any).from('genres').select('*').order('name'),
    ]);
    setMovies(moviesData || []);
    setGenres(genresData || []);

    if (user) {
      const { data: listData } = await (supabase as any).from('my_list').select('content_id').eq('user_id', user.id);
      setMyListIds(new Set((listData || []).map((i: any) => i.content_id)));
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
  }, [user, myListIds]);

  const filtered = selectedGenre === 'all'
    ? movies
    : movies.filter((m) => m.genre_ids?.includes(selectedGenre));

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <h1 className="mb-6 text-3xl font-bold">Movies</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedGenre('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${selectedGenre === 'all' ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}
        >
          All
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGenre(g.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${selectedGenre === g.id ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}
          >
            {g.name}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-dark-400">No movies found</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((movie) => (
            <ContentCard key={movie.id} content={movie} inList={myListIds.has(movie.id)} onToggleList={toggleList} />
          ))}
        </div>
      )}
    </div>
  );
}
