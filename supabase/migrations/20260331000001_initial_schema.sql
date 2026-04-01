-- ─────────────────────────────────────────────────────────────────────────────
-- ClashPro — Schema inicial
-- ─────────────────────────────────────────────────────────────────────────────

-- Perfiles (extiende auth.users de Supabase)
create table public.profiles (
  id                    uuid references auth.users(id) on delete cascade primary key,
  name                  text,
  photo_url             text,
  spotify_id            text,
  spotify_access_token  text,
  spotify_refresh_token text,
  created_at            timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles: propietario" on public.profiles
  for all using (auth.uid() = id);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, photo_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Competidores globales
create table public.competitors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  photo_url  text,
  user_id    uuid references public.profiles(id),
  is_active  boolean default true,
  created_at timestamptz default now()
);
alter table public.competitors enable row level security;
create policy "competitors: lectura pública" on public.competitors
  for select using (true);
create policy "competitors: escritura autenticada" on public.competitors
  for all using (auth.uid() is not null);

-- Playlists del sistema
create table public.playlists (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  spotify_uri    text not null,
  spotify_url    text,
  recommended_by uuid references public.profiles(id),
  is_system      boolean default true,
  created_at     timestamptz default now()
);
alter table public.playlists enable row level security;
create policy "playlists: lectura pública" on public.playlists
  for select using (true);
create policy "playlists: escritura autenticada" on public.playlists
  for all using (auth.uid() is not null);

-- Favoritos por usuario
create table public.user_favorite_tracks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  name        text not null,
  artist      text,
  spotify_uri text not null,
  created_at  timestamptz default now(),
  unique(user_id, spotify_uri)
);
alter table public.user_favorite_tracks enable row level security;
create policy "favorites: propietario" on public.user_favorite_tracks
  for all using (auth.uid() = user_id);

-- Torneos
create table public.tournaments (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  date               date not null default current_date,
  round_time_seconds integer default 40,
  created_by         uuid references public.profiles(id),
  created_at         timestamptz default now()
);
alter table public.tournaments enable row level security;
create policy "tournaments: lectura pública" on public.tournaments
  for select using (true);
create policy "tournaments: escritura autenticada" on public.tournaments
  for all using (auth.uid() is not null);

-- Competidores por torneo
create table public.tournament_competitors (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  competitor_id uuid references public.competitors(id),
  is_active     boolean default true,
  unique(tournament_id, competitor_id)
);
alter table public.tournament_competitors enable row level security;
create policy "tc: lectura pública" on public.tournament_competitors
  for select using (true);
create policy "tc: escritura autenticada" on public.tournament_competitors
  for all using (auth.uid() is not null);

-- Rondas
create table public.rounds (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  round_number  integer not null,
  created_at    timestamptz default now()
);
alter table public.rounds enable row level security;
create policy "rounds: lectura pública" on public.rounds
  for select using (true);
create policy "rounds: escritura autenticada" on public.rounds
  for all using (auth.uid() is not null);

-- Batallas 1v1
create table public.battles (
  id              uuid primary key default gen_random_uuid(),
  round_id        uuid references public.rounds(id) on delete cascade,
  competitor_a_id uuid references public.competitors(id),
  competitor_b_id uuid references public.competitors(id),
  result          text check (result in ('A','B','draw','bye')),
  is_bye          boolean default false,
  track_uri       text,
  track_name      text,
  completed       boolean default false,
  created_at      timestamptz default now()
);
alter table public.battles enable row level security;
create policy "battles: lectura pública" on public.battles
  for select using (true);
create policy "battles: escritura autenticada" on public.battles
  for all using (auth.uid() is not null);

-- ─── Seed ────────────────────────────────────────────────────────────────────

insert into public.competitors (name) values
  ('Daniel Alfaro'), ('Daniel Ambriz'), ('William Daniel'),
  ('Aly'), ('Sahad'), ('Yi'), ('Fer'), ('Mundo');

insert into public.playlists (name, spotify_uri, spotify_url) values
  ('SALSANAMÁ MX OFICIAL',            'spotify:playlist:01ijIUEbfx4JAYP4cdPOX3', 'https://open.spotify.com/playlist/01ijIUEbfx4JAYP4cdPOX3'),
  ('Salsanama Training 2026',          'spotify:playlist:7prxrpTaqFEDleRHrT7wbR', 'https://open.spotify.com/playlist/7prxrpTaqFEDleRHrT7wbR'),
  ('A MI MANERA | SALSANAMA TURKEY',  'spotify:playlist:7legD3mxgnZxL3sEMtxNsv', 'https://open.spotify.com/playlist/7legD3mxgnZxL3sEMtxNsv'),
  ('SALSANAMÀ 2020',                   'spotify:playlist:1O1TltOSAfoOpQxfIBc2HT', 'https://open.spotify.com/playlist/1O1TltOSAfoOpQxfIBc2HT'),
  ('PROPOSALS',                        'spotify:playlist:0J6LUPCOmgErQZAA7mqVID', 'https://open.spotify.com/playlist/0J6LUPCOmgErQZAA7mqVID');
