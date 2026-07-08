'use client';

import { useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WatchHistoryParams {
  userId: string;
  contentId: string;
  episodeId: string | null;
}

export function useWatchHistory({ userId, contentId, episodeId }: WatchHistoryParams) {
  const supabase = createClient();
  // Cache the found record id so we UPDATE instead of SELECT every time
  const recordId = useRef<string | null>(null);
  const initialized = useRef(false);

  const save = useCallback(async (progress: number, duration: number) => {
    if (!userId || !contentId) return;

    const completed = duration > 0 && progress / duration > 0.9;
    const now = new Date().toISOString();

    // If we already found the record id, just UPDATE it
    if (recordId.current) {
      const id = recordId.current;
      await (supabase as any)
        .from('watch_history')
        .update({ progress, duration, completed, watched_at: now })
        .eq('id', id);
      return;
    }

    // First call: look for an existing record
    const query = supabase
      .from('watch_history')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId);

    const { data: existing } = episodeId
      ? await query.eq('episode_id', episodeId).maybeSingle()
      : await query.is('episode_id', null).maybeSingle();

    if (existing) {
      recordId.current = (existing as any).id;
      const id = recordId.current!;
      await (supabase as any)
        .from('watch_history')
        .update({ progress, duration, completed, watched_at: now })
        .eq('id', id);
    } else {
      const { data: inserted } = await supabase
        .from('watch_history')
        .insert({
          user_id: userId,
          content_id: contentId,
          episode_id: episodeId ?? null,
          progress,
          duration,
          completed,
        } as any)
        .select('id')
        .single();
      if (inserted) recordId.current = (inserted as any).id;
    }
  }, [userId, contentId, episodeId]);

  // Call once when the video duration becomes known (records the watch immediately)
  const init = useCallback(async (duration: number) => {
    if (initialized.current) return;
    initialized.current = true;
    await save(0, duration);
  }, [save]);

  return { save, init };
}
