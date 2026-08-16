-- Keba Streaming Platform Database Schema

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  subscription_status text not null default 'free' check (subscription_status in ('free', 'active', 'cancelled', 'expired')),
  subscription_plan text,
  subscription_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Genres
create table public.genres (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Content (movies and series)
create table public.content (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  description text not null,
  type text not null check (type in ('movie', 'series')),
  genre_ids uuid[] default '{}',
  release_year integer not null,
  rating text,
  duration integer,
  thumbnail_url text,
  poster_url text,
  backdrop_url text,
  trailer_url text,
  cloudflare_video_id text,
  subtitle_url text,
  completion_count integer not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seasons
create table public.seasons (
  id uuid primary key default uuid_generate_v4(),
  content_id uuid not null references public.content on delete cascade,
  season_number integer not null,
  title text not null,
  description text,
  poster_url text,
  created_at timestamptz not null default now(),
  unique(content_id, season_number)
);

-- Episodes
create table public.episodes (
  id uuid primary key default uuid_generate_v4(),
  season_id uuid not null references public.seasons on delete cascade,
  content_id uuid not null references public.content on delete cascade,
  episode_number integer not null,
  title text not null,
  description text,
  duration integer not null,
  thumbnail_url text,
  cloudflare_video_id text not null,
  subtitle_url text,
  created_at timestamptz not null default now(),
  unique(season_id, episode_number)
);

-- Watch history
create table public.watch_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles on delete cascade,
  content_id uuid not null references public.content on delete cascade,
  episode_id uuid references public.episodes on delete set null,
  progress float not null default 0,
  duration float not null,
  completed boolean not null default false,
  watched_at timestamptz not null default now()
);

create unique index watch_history_unique on public.watch_history (user_id, content_id, coalesce(episode_id, '00000000-0000-0000-0000-000000000000'));

-- Keeps content.completion_count in sync automatically. Regular users can
-- only read their own watch_history rows (RLS), so the "Most Finished" row
-- on the browse page needs this aggregate counter instead of computing it
-- from watch_history directly.
create or replace function public.increment_completion_count()
returns trigger as $$
begin
  if new.completed = true and (tg_op = 'INSERT' or old.completed is distinct from true) then
    update public.content set completion_count = completion_count + 1 where id = new.content_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger watch_history_completion_count
  after insert or update on public.watch_history
  for each row execute procedure public.increment_completion_count();

-- My List / Favourites
create table public.my_list (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles on delete cascade,
  content_id uuid not null references public.content on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, content_id)
);

-- Subscription plans
create table public.subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  price numeric(10,2) not null,
  currency text not null default 'USD',
  interval text not null check (interval in ('month', 'year')),
  features text[] default '{}',
  max_screens integer not null default 1,
  max_quality text not null default '720p',
  download_allowed boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Push subscriptions
create table public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_content_type on public.content(type);
create index idx_content_published on public.content(is_published);
create index idx_content_featured on public.content(is_featured);
create index idx_content_slug on public.content(slug);
create index idx_watch_history_user on public.watch_history(user_id);
create index idx_my_list_user on public.my_list(user_id);
create index idx_episodes_season on public.episodes(season_id);
create index idx_episodes_content on public.episodes(content_id);
create index idx_seasons_content on public.seasons(content_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger content_updated_at before update on public.content
  for each row execute procedure public.update_updated_at();

-- Prevent privilege escalation: "Users can update own profile" below only
-- restricts WHICH row a user can touch (their own), not which columns they
-- can set on it — without this trigger, any authenticated user can call
-- `.from('profiles').update({ role: 'admin' })` on their own row directly
-- from the browser and grant themselves admin (or a free subscription) with
-- no server-side check involved. Silently reverts role/subscription fields
-- back to their prior value unless the request is made with the service
-- role key (i.e. from trusted server-side code, not a user's browser).
create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
begin
  if auth.role() <> 'service_role' then
    new.role := old.role;
    new.subscription_status := old.subscription_status;
    new.subscription_plan := old.subscription_plan;
    new.subscription_end := old.subscription_end;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger protect_profile_privileges before update on public.profiles
  for each row execute procedure public.prevent_profile_privilege_escalation();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.content enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;
alter table public.genres enable row level security;
alter table public.watch_history enable row level security;
alter table public.my_list enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.push_subscriptions enable row level security;

-- Profiles: users can read own, admins can read all
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update all profiles" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Content: published content visible to all authenticated, admins can manage
create policy "Anyone can view published content" on public.content for select using (is_published = true);
create policy "Admins can manage content" on public.content for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Seasons: visible if content is published
create policy "Anyone can view seasons" on public.seasons for select using (
  exists (select 1 from public.content where id = content_id and is_published = true)
);
create policy "Admins can manage seasons" on public.seasons for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Episodes: visible if content is published
create policy "Anyone can view episodes" on public.episodes for select using (
  exists (select 1 from public.content where id = content_id and is_published = true)
);
create policy "Admins can manage episodes" on public.episodes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Genres: readable by all, managed by admins
create policy "Anyone can view genres" on public.genres for select to authenticated using (true);
create policy "Admins can manage genres" on public.genres for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Watch history: users own data only
create policy "Users can manage own watch history" on public.watch_history for all using (auth.uid() = user_id);

-- My list: users own data only
create policy "Users can manage own list" on public.my_list for all using (auth.uid() = user_id);

-- Subscription plans: readable by all
create policy "Anyone can view plans" on public.subscription_plans for select using (true);
create policy "Admins can manage plans" on public.subscription_plans for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Push subscriptions: users own data only
create policy "Users can manage own push subs" on public.push_subscriptions for all using (auth.uid() = user_id);

-- Seed subscription plans
insert into public.subscription_plans (name, slug, price, interval, features, max_screens, max_quality, download_allowed) values
  ('Basic', 'basic', 4.99, 'month', '{"SD Quality", "1 Screen", "Ad-supported"}', 1, '480p', false),
  ('Standard', 'standard', 9.99, 'month', '{"HD Quality", "2 Screens", "Ad-free"}', 2, '1080p', true),
  ('Premium', 'premium', 14.99, 'month', '{"4K + HDR", "4 Screens", "Ad-free", "Downloads"}', 4, '4k', true);

-- Seed genres
insert into public.genres (name, slug) values
  ('Action', 'action'),
  ('Comedy', 'comedy'),
  ('Drama', 'drama'),
  ('Horror', 'horror'),
  ('Sci-Fi', 'sci-fi'),
  ('Thriller', 'thriller'),
  ('Romance', 'romance'),
  ('Documentary', 'documentary'),
  ('Animation', 'animation'),
  ('Fantasy', 'fantasy'),
  ('Crime', 'crime'),
  ('Adventure', 'adventure');
