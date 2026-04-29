create or replace function public.seed_roster_for_user(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if uid is null then
    return;
  end if;

  insert into public.competitors (name, user_id, level, frequency_count, repeat_count, is_active, last_danced_at)
  select
    x.name,
    uid,
    x.level,
    x.fc,
    x.rc,
    true,
    x.ld::timestamptz
  from (
    values
      ('Daniel Alfaro', 'intermedio'::text, 22, 2, '2026-01-12'),
      ('Daniel Ambriz', 'intermedio', 19, 1, '2026-01-18'),
      ('William Daniel', 'beginner', 8, 0, '2026-02-01'),
      ('Aly', 'avanzado', 35, 4, '2026-02-22'),
      ('Sahad', 'intermedio', 14, 0, '2026-01-25'),
      ('Yi', 'avanzado', 42, 3, '2026-03-08'),
      ('Fer', 'intermedio', 28, 1, '2026-02-14'),
      ('Mundo', 'beginner', 6, 0, '2026-01-08'),
      ('abc', 'beginner', 4, 0, null),
      ('Celeste Alonso', 'intermedio', 16, 1, '2026-02-05'),
      ('Rudy', 'avanzado', 31, 2, '2026-03-01'),
      ('Chuy', 'intermedio', 21, 1, '2026-01-30'),
      ('Amayeli', 'beginner', 11, 0, '2026-02-18'),
      ('Dany Fuego', 'avanzado', 38, 5, '2026-03-12'),
      ('Chucho', 'intermedio', 17, 0, '2026-01-14'),
      ('Colocho', 'beginner', 9, 0, null),
      ('Ilse', 'intermedio', 25, 2, '2026-02-28'),
      ('Mayra', 'intermedio', 13, 0, '2026-01-20'),
      ('Maggio', 'beginner', 7, 0, '2026-02-10')
  ) as x(name, level, fc, rc, ld)
  where not exists (
    select 1
    from public.competitors c
    where c.user_id = uid
      and lower(trim(c.name)) = lower(trim(x.name))
  );
end;
$$;

grant execute on function public.seed_roster_for_user(uuid) to service_role;

create or replace function public.trg_seed_roster_on_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_roster_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_profile_seed_roster on public.profiles;
create trigger on_profile_seed_roster
  after insert on public.profiles
  for each row
  execute procedure public.trg_seed_roster_on_new_profile();

do $$
declare
  r record;
begin
  for r in select id from public.profiles
  loop
    perform public.seed_roster_for_user(r.id);
  end loop;
end $$;
