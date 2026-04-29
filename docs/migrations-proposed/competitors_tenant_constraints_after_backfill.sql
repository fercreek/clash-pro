alter table public.competitors
  alter column user_id set not null;

create unique index if not exists competitors_user_alive_name_uniq
  on public.competitors (user_id, lower(trim(name)))
  where deleted_at is null;
