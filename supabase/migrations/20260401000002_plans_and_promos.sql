-- ─────────────────────────────────────────────────────────────────────────────
-- Planes de usuario + sistema de códigos promocionales
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Columnas de plan en profiles
alter table public.profiles
  add column if not exists plan text not null default 'free'
  check (plan in ('free', 'pro', 'event'));

alter table public.profiles
  add column if not exists plan_expires_at timestamptz;

-- 2. Tabla de códigos promocionales
create table public.promo_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  plan       text not null default 'pro' check (plan in ('pro', 'event')),
  max_uses   integer not null default 100,
  uses_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table public.promo_codes enable row level security;

-- Lectura pública para validar desde el cliente
create policy "promo_codes: lectura pública"
  on public.promo_codes for select using (true);

-- 3. Registro de canjes (evita usar el mismo código dos veces)
create table public.promo_redemptions (
  id          uuid primary key default gen_random_uuid(),
  code_id     uuid references public.promo_codes(id),
  user_id     uuid references public.profiles(id) on delete cascade,
  redeemed_at timestamptz default now(),
  unique(user_id, code_id)
);

alter table public.promo_redemptions enable row level security;

create policy "redemptions: propietario"
  on public.promo_redemptions
  for all using (auth.uid() = user_id);

-- 4. RPC para canjear código de forma segura y atómica
create or replace function public.redeem_promo_code(p_code text)
returns json
language plpgsql security definer
as $$
declare
  v_code  public.promo_codes%rowtype;
  v_uid   uuid := auth.uid();
  v_used  boolean;
begin
  if v_uid is null then
    return json_build_object('error', 'No autenticado');
  end if;

  -- Buscar código válido
  select * into v_code
  from public.promo_codes
  where upper(code) = upper(p_code)
    and (expires_at is null or expires_at > now())
    and uses_count < max_uses;

  if not found then
    return json_build_object('error', 'Código inválido o expirado');
  end if;

  -- Verificar si ya fue canjeado por este usuario
  select exists(
    select 1 from public.promo_redemptions
    where user_id = v_uid and code_id = v_code.id
  ) into v_used;

  if v_used then
    return json_build_object('error', 'Ya usaste este código');
  end if;

  -- Registrar canje
  insert into public.promo_redemptions (code_id, user_id)
  values (v_code.id, v_uid);

  -- Incrementar contador de uso
  update public.promo_codes
  set uses_count = uses_count + 1
  where id = v_code.id;

  -- Activar plan en el perfil
  update public.profiles
  set plan = v_code.plan
  where id = v_uid;

  return json_build_object('success', true, 'plan', v_code.plan);
end;
$$;

-- 5. Seed: código de acceso para amigos (cambiar antes de compartir)
insert into public.promo_codes (code, plan, max_uses)
values ('SALSANAMA26', 'pro', 50);
