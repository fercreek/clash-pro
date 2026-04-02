alter table public.user_tournament_state
  add column if not exists competition_mode text not null default 'tournament'
  check (competition_mode in ('practice', 'tournament'));
