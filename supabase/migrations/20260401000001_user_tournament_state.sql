-- ─────────────────────────────────────────────────────────────────────────────
-- Estado de torneo por usuario (snapshot completo para persistencia rápida)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.user_tournament_state (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  competitors     jsonb not null default '[]',
  matches         jsonb not null default '[]',
  round_time      integer not null default 40,
  screen          text not null default 'setup',
  active_match_id text,
  updated_at      timestamptz default now(),
  created_at      timestamptz default now(),
  unique(user_id)   -- un estado activo por usuario
);

alter table public.user_tournament_state enable row level security;

-- Solo el propio usuario puede leer/escribir su estado
create policy "tournament_state: propietario"
  on public.user_tournament_state
  for all
  using (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_tournament_state_updated_at
  before update on public.user_tournament_state
  for each row execute procedure public.set_updated_at();
