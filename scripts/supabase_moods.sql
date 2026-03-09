-- Moods table for mood tracking (multiple records per day allowed)
drop table if exists public.moods cascade;

create table public.moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null,
  note text,
  created_at timestamptz not null default now()
);

-- Index for fast lookups by user and date
create index moods_user_id_created_at_idx on public.moods (user_id, created_at desc);

alter table public.moods enable row level security;

-- Drop any existing policies (handles both "own" and "their" naming)
drop policy if exists "Users can view their moods" on public.moods;
drop policy if exists "Users can view own moods" on public.moods;
create policy "Users can view own moods"
on public.moods for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their moods" on public.moods;
drop policy if exists "Users can insert own moods" on public.moods;
create policy "Users can insert own moods"
on public.moods for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their moods" on public.moods;
drop policy if exists "Users can update own moods" on public.moods;
create policy "Users can update own moods"
on public.moods for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their moods" on public.moods;
drop policy if exists "Users can delete own moods" on public.moods;
create policy "Users can delete own moods"
on public.moods for delete using (auth.uid() = user_id);
