'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import type { Genre } from '@/types/database';
import toast from 'react-hot-toast';

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [name, setName] = useState('');
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('genres').select('*').order('name');
    setGenres(data || []);
  };

  const save = async () => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (editingGenre) {
      await supabase.from('genres').update({ name, slug }).eq('id', editingGenre.id);
      toast.success('Genre updated');
    } else {
      await supabase.from('genres').insert({ name, slug });
      toast.success('Genre created');
    }
    setShowModal(false); setName(''); setEditingGenre(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this genre?')) return;
    await supabase.from('genres').delete().eq('id', id);
    toast.success('Deleted'); load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Genres</h1>
        <button onClick={() => { setEditingGenre(null); setName(''); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Genre
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {genres.map((g) => (
          <div key={g.id} className="card flex items-center justify-between p-4">
            <span className="font-medium">{g.name}</span>
            <div className="flex gap-2">
              <button onClick={() => { setEditingGenre(g); setName(g.name); setShowModal(true); }} className="rounded p-1 hover:bg-dark-700"><Edit className="h-4 w-4" /></button>
              <button onClick={() => remove(g.id)} className="rounded p-1 text-red-400 hover:bg-dark-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingGenre ? 'Edit Genre' : 'Add Genre'} size="sm">
        <div className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Genre name" />
          <button onClick={save} className="btn-primary w-full">{editingGenre ? 'Update' : 'Create'}</button>
        </div>
      </Modal>
    </div>
  );
}
