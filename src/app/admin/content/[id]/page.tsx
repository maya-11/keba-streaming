'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ContentForm } from '@/components/admin/content-form';
import { SeasonManager } from '@/components/admin/season-manager';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Content } from '@/types/database';

export default function EditContentPage() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    const { data } = await supabase.from('content').select('*').eq('id', id).single();
    setContent(data);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (!content) return <p className="text-dark-400">Content not found</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit: {content.title}</h1>
      <ContentForm initialData={content} />
      {content.type === 'series' && (
        <div className="mt-8">
          <SeasonManager contentId={content.id} />
        </div>
      )}
    </div>
  );
}
