alter table public.user_tournament_state
  add column if not exists battle_round_count integer not null default 4
  check (battle_round_count >= 1 and battle_round_count <= 4);

create table if not exists public.tournament_public_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  public_id text not null unique,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists tournament_public_snapshots_public_id_idx
  on public.tournament_public_snapshots (public_id);

alter table public.tournament_public_snapshots enable row level security;

drop policy if exists "tournament_public_snapshots_owner" on public.tournament_public_snapshots;
create policy "tournament_public_snapshots_owner"
  on public.tournament_public_snapshots
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tournament_public_snapshots_select_anon" on public.tournament_public_snapshots;
create policy "tournament_public_snapshots_select_anon"
  on public.tournament_public_snapshots
  for select
  to anon, authenticated
  using (true);

drop trigger if exists tournament_public_snapshots_updated_at on public.tournament_public_snapshots;
create trigger tournament_public_snapshots_updated_at
  before update on public.tournament_public_snapshots
  for each row execute procedure public.set_updated_at();

alter table public.tournament_public_snapshots replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.tournament_public_snapshots;
exception
  when duplicate_object then null;
end $$;
