-- ============================================================
-- MindCareAI: Supabase as source of truth (profiles already exists)
-- Run after supabase_profiles.sql and supabase_moods.sql
-- ============================================================

-- -------------------------------------------------------------
-- 1. Extend moods table (add stress_level, activities, mood_date)
-- -------------------------------------------------------------
alter table public.moods
  add column if not exists mood_date date,
  add column if not exists stress_level integer not null default 0,
  add column if not exists activities jsonb default '[]'::jsonb;

-- Backfill mood_date from created_at for existing rows
update public.moods set mood_date = (created_at::date) where mood_date is null;

-- Default for new rows (cannot reference other columns in DEFAULT)
alter table public.moods alter column mood_date set default current_date;

-- -------------------------------------------------------------
-- 2. Journals table
-- -------------------------------------------------------------
drop table if exists public.journals cascade;

create table public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  emotions jsonb not null default '[]'::jsonb,
  ai_insights text,
  created_at timestamptz not null default now()
);

create index journals_user_id_created_at_idx on public.journals (user_id, created_at desc);
alter table public.journals enable row level security;

drop policy if exists "Users can view own journals" on public.journals;
create policy "Users can view own journals" on public.journals for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own journals" on public.journals;
create policy "Users can insert own journals" on public.journals for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own journals" on public.journals;
create policy "Users can update own journals" on public.journals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own journals" on public.journals;
create policy "Users can delete own journals" on public.journals for delete using (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 3. Sleep logs table
-- -------------------------------------------------------------
drop table if exists public.sleep_logs cascade;

create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  sleep_hours numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create index sleep_logs_user_id_created_at_idx on public.sleep_logs (user_id, created_at desc);
alter table public.sleep_logs enable row level security;

drop policy if exists "Users can view own sleep_logs" on public.sleep_logs;
create policy "Users can view own sleep_logs" on public.sleep_logs for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own sleep_logs" on public.sleep_logs;
create policy "Users can insert own sleep_logs" on public.sleep_logs for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own sleep_logs" on public.sleep_logs;
create policy "Users can update own sleep_logs" on public.sleep_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own sleep_logs" on public.sleep_logs;
create policy "Users can delete own sleep_logs" on public.sleep_logs for delete using (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 4. Goals table
-- -------------------------------------------------------------
drop table if exists public.goals cascade;

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index goals_user_id_created_at_idx on public.goals (user_id, created_at desc);
alter table public.goals enable row level security;

drop policy if exists "Users can view own goals" on public.goals;
create policy "Users can view own goals" on public.goals for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own goals" on public.goals;
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own goals" on public.goals;
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own goals" on public.goals;
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);
