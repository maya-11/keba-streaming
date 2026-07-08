-- Fix watch_history so the feature works correctly.
-- Run this in your Supabase SQL Editor.

-- 1. Drop the old expression-based unique index (which couldn't be used for upsert)
drop index if exists public.watch_history_unique;

-- 2. Add a proper named unique constraint on (user_id, content_id) for movies
--    and a separate one for episodes — handled by app logic (select then update/insert).
--    We keep a simple partial unique index for movies (episode_id IS NULL)
--    and another for episodes.
create unique index if not exists watch_history_movie_unique
  on public.watch_history (user_id, content_id)
  where episode_id is null;

create unique index if not exists watch_history_episode_unique
  on public.watch_history (user_id, content_id, episode_id)
  where episode_id is not null;

-- 3. Make duration default to 0 so the initial record can be inserted
--    before the video duration is known.
alter table public.watch_history
  alter column duration set default 0;

-- 4. Drop and recreate the RLS policy to ensure INSERT + UPDATE + DELETE all work
drop policy if exists "Users can manage own watch history" on public.watch_history;

create policy "Users can select own watch history"
  on public.watch_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own watch history"
  on public.watch_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update own watch history"
  on public.watch_history for update
  using (auth.uid() = user_id);

create policy "Users can delete own watch history"
  on public.watch_history for delete
  using (auth.uid() = user_id);
