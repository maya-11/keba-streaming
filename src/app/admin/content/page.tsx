'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Eye, EyeOff, Film, Tv } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Content } from '@/types/database';
import toast from 'react-hot-toast';

export default function AdminContentPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [filter, setFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadContent(); }, []);

  const loadContent = async () => {
    const { data } = await supabase.from('content').select('*').order('created_at', { ascending: false });
    setContent(data || []);
    setLoading(false);
  };

  const togglePublish = async (item: Content) => {
    const { error } = await supabase.from('content').update({ is_published: !item.is_published }).eq('id', item.id);
    if (error) toast.error('Failed to update');
    else {
      setContent((prev) => prev.map((c) => c.id === item.id ? { ...c, is_published: !c.is_published } : c));
      toast.success(item.is_published ? 'Unpublished' : 'Published');
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Delete this content?')) return;
    const { error } = await supabase.from('content').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
      setContent((prev) => prev.filter((c) => c.id !== id));
      toast.success('Deleted');
    }
  };

  const filtered = filter === 'all' ? content : content.filter((c) => c.type === filter);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content</h1>
        <Link href="/admin/content/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Content
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {(['all', 'movie', 'series'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === f ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300'}`}
          >
            {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'Series'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-dark-700 text-dark-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-dark-800/50">
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    {item.type === 'movie' ? <Film className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3">{item.release_year}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${item.is_published ? 'bg-green-900/30 text-green-400' : 'bg-dark-700 text-dark-400'}`}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/content/${item.id}`} className="rounded p-1 hover:bg-dark-700">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button onClick={() => togglePublish(item)} className="rounded p-1 hover:bg-dark-700">
                      {item.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteContent(item.id)} className="rounded p-1 text-red-400 hover:bg-dark-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="py-8 text-center text-dark-400">No content found</p>}
    </div>
  );
}
