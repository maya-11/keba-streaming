'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import type { Season, Episode } from '@/types/database';
import toast from 'react-hot-toast';

interface SeasonManagerProps {
  contentId: string;
}

export function SeasonManager({ contentId }: SeasonManagerProps) {
  const supabase = createClient();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Record<string, Episode[]>>({});
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showEpisodeModal, setShowEpisodeModal] = useState<string | null>(null);
  const [seasonForm, setSeasonForm] = useState({ season_number: 1, title: '', description: '' });
  const [episodeForm, setEpisodeForm] = useState({ episode_number: 1, title: '', description: '', duration: 0, cloudflare_video_id: '', thumbnail_url: '' });

  useEffect(() => { loadSeasons(); }, [contentId]);

  const loadSeasons = async () => {
    const { data } = await supabase.from('seasons').select('*').eq('content_id', contentId).order('season_number');
    setSeasons(data || []);
  };

  const loadEpisodes = async (seasonId: string) => {
    const { data } = await supabase.from('episodes').select('*').eq('season_id', seasonId).order('episode_number');
    setEpisodes((prev) => ({ ...prev, [seasonId]: data || [] }));
  };

  const toggleSeason = async (seasonId: string) => {
    if (expandedSeason === seasonId) { setExpandedSeason(null); return; }
    setExpandedSeason(seasonId);
    if (!episodes[seasonId]) await loadEpisodes(seasonId);
  };

  const addSeason = async () => {
    const { error } = await supabase.from('seasons').insert({ content_id: contentId, ...seasonForm });
    if (error) toast.error('Failed to add season');
    else { toast.success('Season added'); loadSeasons(); setShowSeasonModal(false); setSeasonForm({ season_number: seasons.length + 2, title: '', description: '' }); }
  };

  const deleteSeason = async (id: string) => {
    if (!confirm('Delete this season and all episodes?')) return;
    await supabase.from('seasons').delete().eq('id', id);
    toast.success('Season deleted');
    loadSeasons();
  };

  const addEpisode = async (seasonId: string) => {
    const { error } = await supabase.from('episodes').insert({ season_id: seasonId, content_id: contentId, ...episodeForm });
    if (error) toast.error('Failed to add episode: ' + error.message);
    else { toast.success('Episode added'); loadEpisodes(seasonId); setShowEpisodeModal(null); setEpisodeForm({ episode_number: 1, title: '', description: '', duration: 0, cloudflare_video_id: '', thumbnail_url: '' }); }
  };

  const deleteEpisode = async (episodeId: string, seasonId: string) => {
    if (!confirm('Delete this episode?')) return;
    await supabase.from('episodes').delete().eq('id', episodeId);
    toast.success('Episode deleted');
    loadEpisodes(seasonId);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Seasons & Episodes</h2>
        <button onClick={() => { setSeasonForm({ season_number: seasons.length + 1, title: `Season ${seasons.length + 1}`, description: '' }); setShowSeasonModal(true); }} className="btn-primary flex items-center gap-1 text-sm">
          <Plus className="h-4 w-4" /> Add Season
        </button>
      </div>

      <div className="space-y-3">
        {seasons.map((season) => (
          <div key={season.id} className="card">
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleSeason(season.id)}>
              <div className="flex items-center gap-3">
                {expandedSeason === season.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                <span className="font-medium">Season {season.season_number}: {season.title}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteSeason(season.id); }} className="text-red-400 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {expandedSeason === season.id && (
              <div className="border-t border-dark-800 p-4">
                <div className="mb-3 flex justify-end">
                  <button onClick={() => { setEpisodeForm({ episode_number: (episodes[season.id]?.length || 0) + 1, title: '', description: '', duration: 0, cloudflare_video_id: '', thumbnail_url: '' }); setShowEpisodeModal(season.id); }} className="btn-secondary flex items-center gap-1 text-sm">
                    <Plus className="h-4 w-4" /> Add Episode
                  </button>
                </div>
                {(episodes[season.id] || []).length === 0 ? (
                  <p className="text-sm text-dark-400">No episodes yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-dark-400"><tr><th className="px-2 py-1 text-left">#</th><th className="px-2 py-1 text-left">Title</th><th className="px-2 py-1">Duration</th><th className="px-2 py-1">Actions</th></tr></thead>
                    <tbody>
                      {(episodes[season.id] || []).map((ep) => (
                        <tr key={ep.id} className="border-t border-dark-800">
                          <td className="px-2 py-2">{ep.episode_number}</td>
                          <td className="px-2 py-2">{ep.title}</td>
                          <td className="px-2 py-2 text-center">{ep.duration}m</td>
                          <td className="px-2 py-2 text-center">
                            <button onClick={() => deleteEpisode(ep.id, season.id)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={showSeasonModal} onClose={() => setShowSeasonModal(false)} title="Add Season">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-dark-300">Season Number</label>
            <input type="number" value={seasonForm.season_number} onChange={(e) => setSeasonForm((f) => ({ ...f, season_number: parseInt(e.target.value) }))} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Title</label>
            <input type="text" value={seasonForm.title} onChange={(e) => setSeasonForm((f) => ({ ...f, title: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Description</label>
            <textarea value={seasonForm.description} onChange={(e) => setSeasonForm((f) => ({ ...f, description: e.target.value }))} className="input-field" />
          </div>
          <button onClick={addSeason} className="btn-primary w-full">Add Season</button>
        </div>
      </Modal>

      <Modal isOpen={!!showEpisodeModal} onClose={() => setShowEpisodeModal(null)} title="Add Episode">
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-dark-300">Episode #</label>
              <input type="number" value={episodeForm.episode_number} onChange={(e) => setEpisodeForm((f) => ({ ...f, episode_number: parseInt(e.target.value) }))} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-dark-300">Duration (min)</label>
              <input type="number" value={episodeForm.duration} onChange={(e) => setEpisodeForm((f) => ({ ...f, duration: parseInt(e.target.value) || 0 }))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Title</label>
            <input type="text" value={episodeForm.title} onChange={(e) => setEpisodeForm((f) => ({ ...f, title: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Description</label>
            <textarea value={episodeForm.description} onChange={(e) => setEpisodeForm((f) => ({ ...f, description: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Cloudflare Video ID *</label>
            <input type="text" value={episodeForm.cloudflare_video_id} onChange={(e) => setEpisodeForm((f) => ({ ...f, cloudflare_video_id: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Thumbnail URL</label>
            <input type="text" value={episodeForm.thumbnail_url} onChange={(e) => setEpisodeForm((f) => ({ ...f, thumbnail_url: e.target.value }))} className="input-field" />
          </div>
          <button onClick={() => showEpisodeModal && addEpisode(showEpisodeModal)} className="btn-primary w-full">Add Episode</button>
        </div>
      </Modal>
    </div>
  );
}
