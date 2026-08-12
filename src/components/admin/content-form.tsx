'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Film } from 'lucide-react';
import type { Content, Genre } from '@/types/database';
import toast from 'react-hot-toast';

interface ContentFormProps {
  initialData?: Content;
}

export function ContentForm({ initialData }: ContentFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);

  const [form, setForm] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    type: (initialData?.type || 'movie') as 'movie' | 'series',
    genre_ids: initialData?.genre_ids || [] as string[],
    release_year: initialData?.release_year || new Date().getFullYear(),
    rating: initialData?.rating || '',
    duration: initialData?.duration || 0,
    thumbnail_url: initialData?.thumbnail_url || '',
    poster_url: initialData?.poster_url || '',
    backdrop_url: initialData?.backdrop_url || '',
    trailer_url: initialData?.trailer_url || '',
    cloudflare_video_id: initialData?.cloudflare_video_id || '',
    is_featured: initialData?.is_featured || false,
    is_published: initialData?.is_published || false,
  });

  useEffect(() => {
    supabase.from('genres').select('*').order('name').then(({ data }) => setGenres(data || []));
  }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: initialData ? f.slug : generateSlug(title) }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'thumbnail_url' | 'poster_url' | 'backdrop_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(field);

    const ext = file.name.split('.').pop();
    const path = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });

    if (error) {
      toast.error('Image upload failed: ' + error.message);
      setUploadingImage(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
    setForm((f) => ({ ...f, [field]: publicUrl }));
    toast.success('Image uploaded');
    setUploadingImage(null);
    e.target.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size — Supabase free tier has 50MB limit per file
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('Video must be under 50MB. For larger files use a YouTube URL instead.');
      e.target.value = '';
      return;
    }

    setUploadingVideo(true);
    setVideoProgress(0);
    toast.loading('Uploading video...', { id: 'video-upload' });

    const ext = file.name.split('.').pop();
    const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('media').upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      toast.error('Video upload failed: ' + error.message, { id: 'video-upload' });
      setUploadingVideo(false);
      e.target.value = '';
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
    setForm((f) => ({ ...f, cloudflare_video_id: publicUrl }));
    toast.success('Video uploaded successfully!', { id: 'video-upload' });
    setUploadingVideo(false);
    setVideoProgress(100);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.description) {
      toast.error('Please fill in Title, Slug and Description');
      return;
    }
    setSaving(true);

    if (initialData) {
      const { error } = await supabase.from('content').update(form as any).eq('id', initialData.id);
      if (error) toast.error('Failed to save: ' + error.message);
      else { toast.success('Content updated'); router.push('/admin/content'); }
    } else {
      const { error } = await supabase.from('content').insert(form as any);
      if (error) toast.error('Failed to create: ' + error.message);
      else { toast.success('Content created'); router.push('/admin/content'); }
    }
    setSaving(false);
  };

  const toggleGenre = (genreId: string) => {
    setForm((f) => ({
      ...f,
      genre_ids: f.genre_ids.includes(genreId)
        ? f.genre_ids.filter((id) => id !== genreId)
        : [...f.genre_ids, genreId],
    }));
  };

  const ImageUploadField = ({
    label, field
  }: {
    label: string;
    field: 'thumbnail_url' | 'poster_url' | 'backdrop_url';
  }) => (
    <div>
      <label className="mb-1 block text-sm text-dark-300">{label}</label>
      <div className="space-y-2">
        {form[field] && (
          <div className="relative inline-block">
            <img src={form[field]} alt={label} className="h-24 rounded object-cover" />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, [field]: '' }))}
              className="absolute -right-2 -top-2 rounded-full bg-red-600 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={form[field]}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            className="input-field flex-1 text-sm"
            placeholder="Paste image URL or upload"
          />
          <label className={`btn-secondary flex cursor-pointer items-center gap-1 text-sm whitespace-nowrap ${uploadingImage === field ? 'opacity-50' : ''}`}>
            <Upload className="h-4 w-4" />
            {uploadingImage === field ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, field)}
              className="hidden"
              disabled={uploadingImage !== null}
            />
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Basic Info */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Basic Info</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-dark-300">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="input-field"
              placeholder="Movie or series title"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Slug (auto-generated)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-dark-300">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="input-field min-h-[100px]"
            placeholder="Short description of the content"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-dark-300">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'movie' | 'series' }))}
              className="input-field"
            >
              <option value="movie">Movie</option>
              <option value="series">Series</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Release Year</label>
            <input
              type="number"
              value={form.release_year}
              onChange={(e) => setForm((f) => ({ ...f, release_year: parseInt(e.target.value) }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-dark-300">Rating</label>
            <select
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              className="input-field"
            >
              <option value="">Select rating</option>
              <option value="G">G</option>
              <option value="PG">PG</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R</option>
              <option value="NC-17">NC-17</option>
              <option value="NR">NR</option>
            </select>
          </div>
        </div>
        {form.type === 'movie' && (
          <div>
            <label className="mb-1 block text-sm text-dark-300">Duration (minutes)</label>
            <input
              type="number"
              value={form.duration || ''}
              onChange={(e) => setForm((f) => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
              className="input-field"
              placeholder="e.g. 120"
            />
          </div>
        )}
      </div>

      {/* Genres */}
      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">Genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGenre(g.id)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                form.genre_ids.includes(g.id)
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Images</h2>
        <ImageUploadField label="Poster (portrait — shown on cards)" field="poster_url" />
        <ImageUploadField label="Thumbnail (landscape — shown in rows)" field="thumbnail_url" />
        <ImageUploadField label="Backdrop (wide — shown on hero banner)" field="backdrop_url" />
      </div>

      {/* Video */}
      {form.type === 'movie' ? (
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Video</h2>

        {form.cloudflare_video_id && (
          <div className="flex items-center gap-3 rounded-lg bg-green-900/20 border border-green-800 p-3">
            <Film className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-green-400 font-medium">Video attached</p>
              <p className="text-xs text-dark-400 truncate">{form.cloudflare_video_id}</p>
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, cloudflare_video_id: '' }))}
              className="text-dark-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-dark-300">Upload Video File</label>
          <label className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-dark-600 p-8 transition-colors hover:border-primary-500 ${uploadingVideo ? 'opacity-50' : ''}`}>
            <Film className="mb-2 h-10 w-10 text-dark-500" />
            <p className="text-sm font-medium">
              {uploadingVideo ? `Uploading... please wait` : 'Click to upload video'}
            </p>
            <p className="mt-1 text-xs text-dark-500">MP4, WebM, MOV — max 50MB</p>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/mov,video/quicktime,video/*"
              onChange={handleVideoUpload}
              className="hidden"
              disabled={uploadingVideo}
            />
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm text-dark-300">Or paste a video URL</label>
          <input
            type="text"
            value={form.cloudflare_video_id}
            onChange={(e) => setForm((f) => ({ ...f, cloudflare_video_id: e.target.value }))}
            className="input-field"
            placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
          />
          <p className="mt-1 text-xs text-dark-500">Supports YouTube links and direct MP4 URLs</p>
        </div>
      </div>
      ) : (
        <div className="card p-6 space-y-2 border border-primary-800/50 bg-primary-900/10">
          <h2 className="text-lg font-semibold">Video</h2>
          <p className="text-sm text-dark-300">
            Series don&apos;t have a single video — each episode has its own. Save this form first,
            then scroll down to <strong>Seasons &amp; Episodes</strong> to add a season, add an
            episode, and attach that episode&apos;s video there.
          </p>
        </div>
      )}

      {/* Publishing */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Publishing</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Published (visible to users)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Featured (shown on home banner)</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pb-8">
        <button onClick={handleSave} disabled={saving || uploadingVideo} className="btn-primary">
          {saving ? 'Saving...' : initialData ? 'Update Content' : 'Create Content'}
        </button>
        <button onClick={() => router.push('/admin/content')} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
