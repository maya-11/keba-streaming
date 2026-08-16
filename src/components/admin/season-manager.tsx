'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, ChevronDown, ChevronUp, Upload, Film, X } from 'lucide-react';
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
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
  const [seasonForm, setSeasonForm] = useState({ season_number: 1, title: '', description: '' });
  const [episodeForm, setEpisodeForm] = useState({ episode_number: 1, title: '', description: '', duration: 0, cloudflare_video_id: '', thumbnail_url: '', subtitle_url: '' });

  const handleEpisodeSubtitleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSubtitle(true);
    const ext = file.name.split('.').pop();
    const path = `subtitles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });

    if (error) {
      toast.error('Subtitle upload failed: ' + error.message);
      setUploadingSubtitle(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
    setEpisodeForm((f) => ({ ...f, subtitle_url: publicUrl }));
    toast.success('Subtitle uploaded');
    setUploadingSubtitle(false);
    e.target.value = '';
  };

  const handleEpisodeVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB — Supabase Storage default limit
    if (file.size > maxSize) {
      toast.error('Video must be under 50MB. For larger files use a YouTube URL instead.');
      e.target.value = '';
      return;
    }

    setUploadingVideo(true);
    toast.loading('Uploading video...', { id: 'ep-video-upload' });

    const ext = file.name.split('.').pop();
    const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('media').upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      toast.error('Video upload failed: ' + error.message, { id: 'ep-video-upload' });
      setUploadingVideo(false);
      e.target.value = '';
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
    setEpisodeForm((f) => ({ ...f, cloudflare_video_id: publicUrl }));
    toast.success('Video uploaded successfully!', { id: 'ep-video-upload' });
    setUploadingVideo(false);
    e.target.value = '';
  };

  useEffect(() => { loadSeasons(); }, [contentId]);

  const sb = supabase as any;

  const loadSeasons = async () => {
    const { data } = await sb.from('seasons').select('*').eq('content_id', contentId).order('season_number');
    setSeasons((data as Season[]) || []);
  };

  const loadEpisodes = async (seasonId: string) => {
    const { data } = await sb.from('episodes').select('*').eq('season_id', seasonId).order('episode_number');
    setEpisodes((prev) => ({ ...prev, [seasonId]: (data as Episode[]) || [] }));
  };

  const toggleSeason = async (seasonId: string) => {
    if (expandedSeason === seasonId) { setExpandedSeason(null); return; }
    setExpandedSeason(seasonId);
    if (!episodes[seasonId]) await loadEpisodes(seasonId);
  };

  // Occasionally the browser's session cookie is momentarily stale right
  // after a login or navigation, which makes an otherwise-valid admin
  // insert get rejected by the RLS policy (Postgres error 42501). Refreshing
  // the session and retrying once clears this up without bothering the
  // admin with an error that a second click would've fixed anyway.
  const insertWithRetry = async (table: 'seasons' | 'episodes', row: Record<string, unknown>) => {
    const first = await sb.from(table).insert(row);
    if (!first.error || first.error.code !== '42501') return first;

    await supabase.auth.refreshSession();
    return sb.from(table).insert(row);
  };

  const addSeason = async () => {
    const { error } = await insertWithRetry('seasons', { content_id: contentId, ...seasonForm });
    if (error) toast.error('Failed to add season: ' + error.message);
    else { toast.success('Season added'); loadSeasons(); setShowSeasonModal(false); setSeasonForm({ season_number: seasons.length + 2, title: '', description: '' }); }
  };

  const deleteSeason = async (id: string) => {
    if (!confirm('Delete this season and all episodes?')) return;
    await sb.from('seasons').delete().eq('id', id);
    toast.success('Season deleted');
    loadSeasons();
  };

  const addEpisode = async (seasonId: string) => {
    const { error } = await insertWithRetry('episodes', { season_id: seasonId, content_id: contentId, ...episodeForm });
    if (error) toast.error('Failed to add episode: ' + error.message);
    else { toast.success('Episode added'); loadEpisodes(seasonId); setShowEpisodeModal(null); setEpisodeForm({ episode_number: 1, title: '', description: '', duration: 0, cloudflare_video_id: '', thumbnail_url: '', subtitle_url: '' }); }
  };

  const deleteEpisode = async (episodeId: string, seasonId: string) => {
    if (!confirm('Delete this episode?')) return;
    await sb.from('episodes').delete().eq('id', episodeId);
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
                  <button onClick={() => { setEpisodeForm({ episode_number: (episodes[season.id]?.length || 0) + 1, title: '', description: '', duration: 0, cloudflare_video_id: '', thumbnail_url: '', subtitle_url: '' }); setShowEpisodeModal(season.id); }} className="btn-secondary flex items-center gap-1 text-sm">
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
            <label className="mb-1 block text-sm text-dark-300">Video *</label>

            {episodeForm.cloudflare_video_id && (
              <div className="mb-2 flex items-center gap-3 rounded-lg bg-green-900/20 border border-green-800 p-3">
                <Film className="h-5 w-5 text-green-400 flex-shrink-0" />
                <p className="min-w-0 flex-1 truncate text-xs text-dark-400">{episodeForm.cloudflare_video_id}</p>
                <button
                  type="button"
                  onClick={() => setEpisodeForm((f) => ({ ...f, cloudflare_video_id: '' }))}
                  className="text-dark-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-dark-600 p-6 transition-colors hover:border-primary-500 ${uploadingVideo ? 'opacity-50' : ''}`}>
              <Upload className="mb-1 h-6 w-6 text-dark-500" />
              <p className="text-xs font-medium">{uploadingVideo ? 'Uploading... please wait' : 'Click to upload video'}</p>
              <p className="mt-1 text-[11px] text-dark-500">MP4, WebM, MOV — max 50MB</p>
              <input
                type="file"
                accept="video/mp4,video/webm,video/mov,video/quicktime,video/*"
                onChange={handleEpisodeVideoUpload}
                className="hidden"
                disabled={uploadingVideo}
              />
            </label>

            <input
              type="text"
              value={episodeForm.cloudflare_video_id}
              onChange={(e) => setEpisodeForm((f) => ({ ...f, cloudflare_video_id: e.target.value }))}
              className="input-field mt-2 text-sm"
              placeholder="Or paste a YouTube link or direct video URL"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Thumbnail URL</label>
            <input type="text" value={episodeForm.thumbnail_url} onChange={(e) => setEpisodeForm((f) => ({ ...f, thumbnail_url: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Subtitles (optional)</label>
            {episodeForm.subtitle_url && (
              <div className="mb-2 flex items-center gap-3 rounded-lg bg-green-900/20 border border-green-800 p-3">
                <p className="min-w-0 flex-1 truncate text-xs text-dark-400">{episodeForm.subtitle_url}</p>
                <button
                  type="button"
                  onClick={() => setEpisodeForm((f) => ({ ...f, subtitle_url: '' }))}
                  className="text-dark-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <label className={`btn-secondary inline-flex cursor-pointer items-center gap-1 text-sm ${uploadingSubtitle ? 'opacity-50' : ''}`}>
              <Upload className="h-4 w-4" />
              {uploadingSubtitle ? 'Uploading...' : 'Upload subtitle file (.vtt or .srt)'}
              <input
                type="file"
                accept=".vtt,.srt,text/vtt"
                onChange={handleEpisodeSubtitleUpload}
                className="hidden"
                disabled={uploadingSubtitle}
              />
            </label>
          </div>
          <button
            onClick={() => showEpisodeModal && addEpisode(showEpisodeModal)}
            disabled={uploadingVideo || uploadingSubtitle || !episodeForm.cloudflare_video_id}
            className="btn-primary w-full disabled:opacity-50"
          >
            {uploadingVideo ? 'Uploading video...' : uploadingSubtitle ? 'Uploading subtitle...' : 'Add Episode'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
