update public.competitors c
set user_id = p.id
from (select id from public.profiles order by created_at asc limit 1) p
where c.user_id is null
  and (select count(*)::int from public.profiles) = 1;

do $$
declare
  r record;
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = (select oid from pg_namespace where nspname = 'public')
      and proname = 'seed_roster_for_user'
  ) then
    for r in select id from public.profiles
    loop
      perform public.seed_roster_for_user(r.id);
    end loop;
  end if;
end $$;
