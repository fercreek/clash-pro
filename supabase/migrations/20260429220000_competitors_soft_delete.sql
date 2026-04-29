alter table public.competitors
  add column if not exists deleted_at timestamptz;
