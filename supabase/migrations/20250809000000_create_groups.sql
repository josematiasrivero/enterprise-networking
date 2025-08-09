create extension if not exists "pgcrypto";

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- Policies (recreate idempotently)
 drop policy if exists "Can select own groups" on public.groups;
create policy "Can select own groups"
  on public.groups for select
  using (owner = auth.uid());

 drop policy if exists "Can insert own groups" on public.groups;
create policy "Can insert own groups"
  on public.groups for insert
  with check (owner = auth.uid());

 drop policy if exists "Can update own groups" on public.groups;
create policy "Can update own groups"
  on public.groups for update
  using (owner = auth.uid())
  with check (owner = auth.uid());

 drop policy if exists "Can delete own groups" on public.groups;
create policy "Can delete own groups"
  on public.groups for delete
  using (owner = auth.uid());

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

 drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at(); 