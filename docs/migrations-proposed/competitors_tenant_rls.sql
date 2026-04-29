drop policy if exists "competitors: lectura pública" on public.competitors;
drop policy if exists "competitors: escritura autenticada" on public.competitors;

create policy "competitors: select own"
  on public.competitors for select
  to authenticated
  using (auth.uid() = user_id);

create policy "competitors: insert own"
  on public.competitors for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "competitors: update own"
  on public.competitors for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "competitors: delete own"
  on public.competitors for delete
  to authenticated
  using (auth.uid() = user_id);
