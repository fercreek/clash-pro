# Seguridad Supabase y dependencias (ClashPro)

Mantener al día con **`docs/data-model.md`** (§0 nombres canónicos `MAYÚSCULAS_SNAKE` ↔ Postgres, ER, matriz pantalla → datos). Cualquier cambio de **schema, RLS o consultas** debe revisar y, si aplica, actualizar ese documento y este archivo.

---

## 1. Resumen RLS (estado tras migraciones)

| Tabla | Riesgo previo / notas | Estado |
|-------|----------------------|--------|
| `profiles` | — | OK (`auth.uid() = id`) |
| `competitors` | Lectura/escritura global para cualquier autenticado | **Endurecido** en `20260502120000_competitors_owner_rls.sql` (solo filas `user_id = auth.uid()`). Requiere **cero filas con `user_id` null** antes de aplicar. |
| `practice_sessions` | — | OK (solo propio `user_id`) |
| `user_tournament_state` | — | OK |
| `user_tournament_archives` | — | OK |
| `custom_patterns` | — | OK |
| `promo_redemptions` | — | OK |
| `promo_codes` | `select using (true)` expone códigos a cualquier cliente autenticado que haga `select` | Aceptado mientras el canje sea vía RPC `redeem_promo_code` (security definer). Mejora futura: quitar `select` público y validar solo en RPC. |
| `tournaments`, `tournament_competitors`, `rounds`, `battles` | Misma política débil: cualquier autenticado lee/escribe | **Pendiente**: el cliente no las usa hoy; siguen siendo superficie de ataque con la anon key. Ver §4. |
| `playlists` | Lectura pública + escritura autenticada global | Bajo uso en app; revisar si se escribe desde cliente. |
| `user_favorite_tracks` | — | OK |
| `tournament_public_snapshots` | `select` para `anon` y `authenticated` con `using (true)` | Intencional para **live público** por `public_id`; escritura solo dueño. |

---

## 2. Orden recomendado al aplicar `competitors` RLS

1. Ejecutar migraciones de backfill ya existentes (`assign_orphan_competitors`, `seed_roster_per_profile`, etc.) hasta que **`select count(*) from competitors where user_id is null`** sea 0.
2. Aplicar `supabase db push` con `20260502120000_competitors_owner_rls.sql`.
3. Probar login, `/dancers`, setup, `bumpFrequency` / merge duplicados.

Si el paso 1 falla en un entorno, **no** aplicar esta migración ahí hasta corregir datos.

---

## 3. Dependencias y `npm audit` (Node 20+)

### Versiones principales (`package.json`)

| Paquete | Uso | Rango actual |
|---------|-----|--------------|
| `react` / `react-dom` | UI | ^18.3.1 |
| `vite` | Build / dev | ^5.4.x |
| `@vitejs/plugin-react` | Vite + React | ^4.3.x |
| `@supabase/supabase-js` | Cliente Supabase | ^2.x (subir parches con `npm update @supabase/supabase-js`) |
| `vite-plugin-pwa` | PWA / workbox | ^0.21.x |
| `postcss` | Pipeline Tailwind | **≥ 8.5.10** (mitiga GHSA-qx2v-qp2m-jg93) |
| `marked` | Markdown blog | ^18.x |

### `engines`

`package.json` exige **Node ≥ 20**. Para el CLI de Supabase y evitar avisos `EBADENGINE` en dependencias transitivas, conviene **Node ≥ 20.17** en CI y máquinas de desarrollo.

### Hallazgos típicos de `npm audit` (Vite 5)

- **esbuild** (moderado): impacto principalmente en **servidor de desarrollo** de Vite, no en el bundle de producción servido estático. Mitigación: no exponer `vite dev` a red pública; actualizar a Vite 6+ cuando el proyecto planifique breaking changes.
- **serialize-javascript** (alto): viene de **workbox** / `vite-plugin-pwa` → `@rollup/plugin-terser`. `npm audit fix --force` suele bajar versiones de PWA/Vite con breaking changes; valorar actualización coordinada de `vite-plugin-pwa` + Vite en una tarea aparte.
- Tras **`npm audit fix`** sin `--force`**, revisar de nuevo `npm audit` y este documento.

### Comando útil

```bash
npm audit
npm update @supabase/supabase-js @vercel/blob marked postcss
```

---

## 4. Roadmap seguridad BD (opcional)

**Torneo relacional** (`tournaments` → `battles`): políticas tipo `created_by = auth.uid()` y, en tablas hijas, `exists (select 1 from tournaments t where t.id = … and t.created_by = auth.uid())`. Solo cuando el producto use estas tablas desde el cliente o RPC.

**`promo_codes`**: restringir `select` y exponer validación solo vía RPC o rol `service_role` en Edge Function.

---

## 5. Checklist al tocar Supabase o datos

- [ ] Leer / actualizar **`docs/data-model.md`**.
- [ ] Si es RLS o `competitors`: leer **`docs/supabase-security.md`** §1–2.
- [ ] Migración nueva en `supabase/migrations/`, idempotente, sin editar migraciones ya aplicadas en remoto.
- [ ] Tras cambiar deps: `npm run build` y `npm audit`.
