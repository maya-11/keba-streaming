'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ContentCard } from '@/components/content/content-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Search } from 'lucide-react';
import type { Content } from '@/types/database';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (query) search(query);
  }, [query]);

  const search = async (q: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('content')
      .select('*')
      .eq('is_published', true)
      .ilike('title', `%${q}%`)
      .order('title')
      .limit(50);
    setResults(data || []);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <h1 className="mb-6 text-3xl font-bold">Search</h1>
      {query && (
        <p className="mb-6 text-dark-400">
          {loading ? 'Searching...' : `${results.length} results for "${query}"`}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : results.length === 0 && query ? (
        <div className="py-16 text-center">
          <Search className="mx-auto mb-4 h-16 w-16 text-dark-600" />
          <p className="text-dark-400">No results found for "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((item) => (
            <ContentCard key={item.id} content={item} />
          ))}
        </div>
      )}
    </div>
  );
}
