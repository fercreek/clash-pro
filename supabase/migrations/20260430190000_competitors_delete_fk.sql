alter table public.tournament_competitors
  drop constraint if exists tournament_competitors_competitor_id_fkey;

alter table public.tournament_competitors
  add constraint tournament_competitors_competitor_id_fkey
  foreign key (competitor_id) references public.competitors (id) on delete cascade;

alter table public.battles
  drop constraint if exists battles_competitor_a_id_fkey;

alter table public.battles
  add constraint battles_competitor_a_id_fkey
  foreign key (competitor_a_id) references public.competitors (id) on delete set null;

alter table public.battles
  drop constraint if exists battles_competitor_b_id_fkey;

alter table public.battles
  add constraint battles_competitor_b_id_fkey
  foreign key (competitor_b_id) references public.competitors (id) on delete set null;
