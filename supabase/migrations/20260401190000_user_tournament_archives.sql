create table public.user_tournament_archives (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  competitors       jsonb not null default '[]',
  matches           jsonb not null default '[]',
  round_time        integer not null default 40,
  competition_mode  text not null default 'tournament',
  finished_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index user_tournament_archives_user_finished_idx
  on public.user_tournament_archives (user_id, finished_at desc);

alter table public.user_tournament_archives enable row level security;

create policy "tournament_archives: propietario"
  on public.user_tournament_archives
  for all
  using (auth.uid() = user_id);
