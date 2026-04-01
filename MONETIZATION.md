# ClashPro — Estrategia de monetización

> Actualizado: 2026-04-01

## Visión real del producto

ClashPro **no es un SaaS B2B**. Es una herramienta para bailarines que practican y para eventos locales de salsa.

El valor está en el piso de baile:
- El instructor llega a clase, abre la app, selecciona quién está hoy → en 30 segundos están compitiendo
- El ranking motiva semana a semana ("llevas 3 semanas sin perder contra Daniel")
- En un evento local, el organizador proyecta la pantalla o pasa el teléfono — sin papel, sin Excel

---

## ¿A quién le sirve?

| Usuario | Contexto | Frecuencia de uso |
|---------|----------|-------------------|
| **Instructor / academia** | Clases regulares de 8–20 alumnos, torneos internos semanales | Semanal |
| **Grupo de práctica** | Friends & family battles, sin instructor formal | Semanal / mensual |
| **Organizador de evento local** | Competencia de barrio, festival pequeño, showcase | Por evento |

---

## Modelo de monetización

### Free — para siempre
> El uso básico tiene que ser gratis. La comunidad de bailarines no tiene presupuesto para software.

| Límite | Valor |
|--------|-------|
| Competidores por torneo | hasta 8 |
| Torneos activos | 1 a la vez |
| Historial | solo el torneo actual |
| Rondas | Round Robin estándar |
| Spotify | playlists del sistema |

### Pro — $5 USD/mes o $40 USD/año
> Para instructores y grupos que usan la app regularmente.

| Feature | Descripción |
|---------|-------------|
| Competidores ilimitados | sin tope en el roster |
| Torneos ilimitados | varios activos al mismo tiempo |
| Historial completo | ver torneos anteriores, rankings acumulados |
| Estadísticas por bailarín | victorias, rachas, matches jugados |
| Spotify personal | conectar cuenta Spotify para usar tus propias playlists |
| Sin branding de ClashPro | en pantalla compartida/proyectada |

### Evento — $10 USD por evento (pago único)
> Para quien organiza una competencia pública o festival y solo lo usa de vez en cuando.

| Feature | Descripción |
|---------|-------------|
| Todo lo de Pro | por 48 horas |
| Vista de público (QR) | pantalla read-only para proyectar o compartir en grupo |
| Modo juez multi-dispositivo | varios jueces votan desde sus teléfonos |
| Exportar resultado | imagen para Stories / PDF para redes |

---

## ¿Por qué alguien pagaría?

**El instructor que da clase cada semana:**
- Ya usa Excel o papel → pierde 10 minutos armando brackets
- Con ClashPro: 30 segundos, el ranking se actualiza solo, los alumnos se motivan más
- $5/mes es menos que un café → fácil de justificar si lo usa todos los jueves

**El organizador del evento:**
- Quiere quedar bien frente al público
- Una pantalla con el bracket en vivo y el ganador con confetti es una experiencia mucho más profesional
- $10 por evento es nada comparado con lo que ya gasta

---

## Proyecciones realistas

### 6 meses (boca a boca, comunidad Salsanamá)
- 15 usuarios Pro × $5 = **$75/mes**
- 3–5 eventos/mes × $10 = **$30–50/mes**
- Total: **~$100–125/mes**

### 12 meses (grupos de salsa LATAM + España)
- 80 usuarios Pro × $5 = **$400/mes**
- 15 eventos/mes × $10 = **$150/mes**
- Total: **~$550/mes**

### Optimista (comunidad internacional)
- 300 usuarios Pro = **$1,500/mes**
- 40 eventos/mes = **$400/mes**
- Total: **~$1,900/mes**

> No es un negocio de millones, pero puede pagar el hosting y dar un ingreso pasivo real si la comunidad lo adopta.

---

## Stack técnico para cobrar

### Stripe (pagos)
```bash
npm install @stripe/stripe-js stripe
```
- Crear cuenta en stripe.com
- Configurar producto "Pro mensual" ($5) + "Pro anual" ($40) + "Evento" ($10)
- Stripe Checkout (redirect) — lo más simple de implementar
- Webhook en Supabase Edge Function para activar plan tras pago

### Feature flags en el cliente
```js
// src/hooks/usePlan.js
export function usePlan() {
  const { profile } = useAuth()
  const plan = profile?.plan ?? 'free'
  return {
    isFree: plan === 'free',
    isPro: ['pro', 'event'].includes(plan),
    maxCompetitors: plan === 'free' ? 8 : 999,
    hasHistory: plan !== 'free',
    hasMultiJudge: plan === 'event',
    hasPublicView: plan === 'event',
  }
}
```

### Columna `plan` en Supabase
```sql
alter table public.profiles
  add column plan text not null default 'free'
  check (plan in ('free', 'pro', 'event'));

alter table public.profiles
  add column plan_expires_at timestamptz;

alter table public.profiles
  add column stripe_customer_id text;
```

---

## Canales de adquisición (sin ads)

1. **Comunidad Salsanamá** — primeros 10–15 usuarios garantizados, base de prueba real
2. **Instagram / TikTok** — video de 30s mostrando un torneo en vivo. El formato de bracket + cronómetro es muy visual
3. **Grupos de WhatsApp y Facebook** de escuelas de salsa en México, Colombia, España
4. **Contacto directo** — DM a instructores de salsa ofreciendo prueba gratis por un mes
5. **ProductHunt** — cuando el producto esté estable, para visibilidad técnica global

---

## Siguiente paso concreto

**Esta semana (antes de tocar Stripe):**
1. Implementar las features Pro en la app (ver `WORKPLAN.md`)
2. Validar con 5 instructores de Salsanamá: ¿lo usarían? ¿pagarían $5/mes?
3. Decidir si el modelo es mensual o por evento primero

**No hacer todavía:** landing page elaborada, ads, app stores.
Primero valida que el producto sea lo suficientemente bueno como para que alguien lo pida de nuevo.
