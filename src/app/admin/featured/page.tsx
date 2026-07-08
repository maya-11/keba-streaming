'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, StarOff } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Content } from '@/types/database';
import toast from 'react-hot-toast';

export default function AdminFeaturedPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('content').select('*').eq('is_published', true).order('is_featured', { ascending: false }).order('title');
    setContent(data || []);
    setLoading(false);
  };

  const toggle = async (item: Content) => {
    await supabase.from('content').update({ is_featured: !item.is_featured }).eq('id', item.id);
    setContent((prev) => prev.map((c) => c.id === item.id ? { ...c, is_featured: !c.is_featured } : c));
    toast.success(item.is_featured ? 'Removed from featured' : 'Added to featured');
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Featured Content</h1>
      <div className="space-y-2">
        {content.map((item) => (
          <div key={item.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-dark-400">{item.type} &middot; {item.release_year}</p>
            </div>
            <button onClick={() => toggle(item)} className={`rounded-lg p-2 ${item.is_featured ? 'text-yellow-400' : 'text-dark-500 hover:text-dark-300'}`}>
              {item.is_featured ? <Star className="h-5 w-5" fill="currentColor" /> : <StarOff className="h-5 w-5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
