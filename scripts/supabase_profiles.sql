drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age integer not null,
  weight numeric not null,
  height numeric not null,
  sleeping_hours numeric not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, age, weight, height, sleeping_hours)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce((new.raw_user_meta_data ->> 'age')::integer, 0),
    coalesce((new.raw_user_meta_data ->> 'weight')::numeric, 0),
    coalesce((new.raw_user_meta_data ->> 'height')::numeric, 0),
    coalesce((new.raw_user_meta_data ->> 'sleeping_hours')::numeric, 0)
  )
  on conflict (id) do update
  set
    name = excluded.name,
    age = excluded.age,
    weight = excluded.weight,
    height = excluded.height,
    sleeping_hours = excluded.sleeping_hours;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
