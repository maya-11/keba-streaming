'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { ContentCard } from '@/components/content/content-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import type { Content } from '@/types/database';
import toast from 'react-hot-toast';

export default function MyListPage() {
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (user) loadList();
  }, [user]);

  const loadList = async () => {
    setError('');

    // Step 1: get all content_ids saved by this user
    const { data: listRows, error: listError } = await (supabase as any)
      .from('my_list')
      .select('content_id')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (listError) {
      setError('Could not load your list. Please try again.');
      setLoading(false);
      return;
    }

    if (!listRows || listRows.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Step 2: fetch the actual content rows for those IDs
    const ids = listRows.map((r: any) => r.content_id);
    const { data: contentRows, error: contentError } = await (supabase as any)
      .from('content')
      .select('*')
      .in('id', ids)
      .eq('is_published', true);

    if (contentError) {
      setError('Could not load content details. Please try again.');
      setLoading(false);
      return;
    }

    // Preserve the order from my_list (most recently added first)
    const contentMap: Record<string, Content> = {};
    (contentRows || []).forEach((c: Content) => { contentMap[c.id] = c; });
    setItems(ids.map((id: string) => contentMap[id]).filter(Boolean));
    setLoading(false);
  };

  const removeFromList = async (contentId: string) => {
    const { error } = await (supabase as any)
      .from('my_list')
      .delete()
      .eq('user_id', user!.id)
      .eq('content_id', contentId);

    if (error) {
      toast.error('Could not remove from list');
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== contentId));
    toast.success('Removed from My List');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My List</h1>
        {items.length > 0 && (
          <span className="text-sm text-dark-400">{items.length} title{items.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {error ? (
        <div className="py-16 text-center">
          <p className="mb-4 text-red-400">{error}</p>
          <button onClick={loadList} className="btn-secondary">Try Again</button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="mx-auto mb-4 h-16 w-16 text-dark-600" />
          <p className="mb-2 text-lg text-dark-300">Your list is empty</p>
          <p className="mb-6 text-sm text-dark-500">
            Click the <strong className="text-dark-300">+</strong> button on any title to save it here.
          </p>
          <Link href="/browse" className="btn-primary inline-block">Browse Content</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <ContentCard key={item.id} content={item} inList onToggleList={removeFromList} />
          ))}
        </div>
      )}
    </div>
  );
}
