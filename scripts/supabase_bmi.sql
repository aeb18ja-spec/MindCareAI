-- ============================================================
-- MindCareAI: BMI tracking & weight logs
-- Run after supabase_profiles.sql, supabase_moods.sql, supabase_schema.sql
-- ============================================================

-- -------------------------------------------------------------
-- 1. Add BMI columns to profiles
-- -------------------------------------------------------------
alter table public.profiles
  add column if not exists bmi numeric,
  add column if not exists bmi_category text;

-- Backfill BMI for existing rows that have valid weight & height
update public.profiles
set
  bmi = round((weight / ((height / 100.0) * (height / 100.0)))::numeric, 1),
  bmi_category = case
    when (weight / ((height / 100.0) * (height / 100.0))) < 18.5 then 'Underweight'
    when (weight / ((height / 100.0) * (height / 100.0))) < 25   then 'Normal'
    when (weight / ((height / 100.0) * (height / 100.0))) < 30   then 'Overweight'
    else 'Obese'
  end
where height > 0 and weight > 0;

-- -------------------------------------------------------------
-- 2. Trigger to auto-compute BMI on profile update
-- -------------------------------------------------------------
create or replace function public.compute_bmi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  height_m numeric;
  new_bmi numeric;
begin
  if new.height > 0 and new.weight > 0 then
    height_m := new.height / 100.0;
    new_bmi := round((new.weight / (height_m * height_m))::numeric, 1);
    new.bmi := new_bmi;
    new.bmi_category := case
      when new_bmi < 18.5 then 'Underweight'
      when new_bmi < 25   then 'Normal'
      when new_bmi < 30   then 'Overweight'
      else 'Obese'
    end;
  else
    new.bmi := null;
    new.bmi_category := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_compute_bmi on public.profiles;
create trigger trg_compute_bmi
  before insert or update of weight, height on public.profiles
  for each row execute function public.compute_bmi();

-- -------------------------------------------------------------
-- 3. Weight logs table (track weight over time)
-- -------------------------------------------------------------
drop table if exists public.weight_logs cascade;

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric not null,
  log_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index weight_logs_user_id_log_date_idx on public.weight_logs (user_id, log_date desc);
alter table public.weight_logs enable row level security;

drop policy if exists "Users can view own weight_logs" on public.weight_logs;
create policy "Users can view own weight_logs" on public.weight_logs for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own weight_logs" on public.weight_logs;
create policy "Users can insert own weight_logs" on public.weight_logs for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own weight_logs" on public.weight_logs;
create policy "Users can update own weight_logs" on public.weight_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own weight_logs" on public.weight_logs;
create policy "Users can delete own weight_logs" on public.weight_logs for delete using (auth.uid() = user_id);
