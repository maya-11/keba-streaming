'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useWatchHistory } from '@/hooks/use-watch-history';
import { VideoPlayer } from '@/components/content/video-player';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft } from 'lucide-react';
import type { Content, Episode } from '@/types/database';

export default function WatchPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const episodeId = searchParams.get('episode');
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [contentId, setContentId] = useState('');
  const [episodeDbId, setEpisodeDbId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [poster, setPoster] = useState('');
  const [initialProgress, setInitialProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { save: saveHistory, init: initHistory } = useWatchHistory({
    userId: user?.id ?? '',
    contentId,
    episodeId: episodeDbId,
  });

  useEffect(() => {
    loadWatch();
  }, [slug, episodeId]);

  const sb = supabase as any;

  const loadWatch = async () => {
    setLoading(true);
    setError('');

    const contentRes = await sb.from('content').select('*').eq('slug', slug).single();
    const contentData = contentRes.data as Content | null;
    const contentError = contentRes.error;

    if (contentError || !contentData) {
      setError('Content not found');
      setLoading(false);
      return;
    }

    setTitle(contentData.title);
    setContentId(contentData.id);
    setPoster(contentData.backdrop_url || contentData.thumbnail_url || contentData.poster_url || '');

    let videoUrl = '';

    if (episodeId) {
      const epRes = await sb.from('episodes').select('*').eq('id', episodeId).single();
      const epData = epRes.data as Episode | null;
      const epError = epRes.error;

      if (epError || !epData) {
        setError('Episode not found');
        setLoading(false);
        return;
      }

      setEpisodeDbId(epData.id);
      setTitle(`${contentData.title} — Episode ${epData.episode_number}: ${epData.title}`);
      videoUrl = epData.cloudflare_video_id || '';
    } else {
      videoUrl = contentData.cloudflare_video_id || '';
    }

    if (!videoUrl) {
      setError('No video has been uploaded for this title yet.');
      setLoading(false);
      return;
    }

    if (videoUrl.startsWith('http')) {
      setStreamUrl(videoUrl);
    } else {
      const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_SUBDOMAIN;
      setStreamUrl(`https://${subdomain}/${videoUrl}/manifest/video.m3u8`);
    }

    if (user) {
      const query = sb
        .from('watch_history')
        .select('progress')
        .eq('user_id', user.id)
        .eq('content_id', contentData.id)
        .order('watched_at', { ascending: false })
        .limit(1);

      const histRes = episodeId
        ? await query.eq('episode_id', episodeId).maybeSingle()
        : await query.is('episode_id', null).maybeSingle();

      if (histRes.data) setInitialProgress(histRes.data.progress || 0);
    }

    setLoading(false);
  };

  // Called by VideoPlayer when the video duration becomes known
  const handleDurationKnown = useCallback((duration: number) => {
    if (user && contentId) initHistory(duration);
  }, [user, contentId, initHistory]);

  // Called every 10 seconds while playing
  const handleProgress = useCallback((progress: number, duration: number) => {
    if (user && contentId) saveHistory(progress, duration);
  }, [user, contentId, saveHistory]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black gap-4">
        <p className="text-red-400 text-lg">{error}</p>
        <button onClick={() => router.back()} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute left-4 top-4 z-50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-sm text-white backdrop-blur-sm hover:bg-black/70"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <VideoPlayer
        src={streamUrl}
        poster={poster}
        title={title}
        onProgress={handleProgress}
        onDurationKnown={handleDurationKnown}
        initialProgress={initialProgress}
        autoPlay
      />
    </div>
  );
}
