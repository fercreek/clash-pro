# ClashPro — Estrategia de monetización

## TL;DR
El modelo más realista y rápido de implementar es **SaaS por suscripción mensual**
dirigido a escuelas de salsa, instructores y organizadores de competencias.
Precio sugerido: **$9–19 USD/mes** por cuenta pro.

---

## 1. ¿A quién le vendes?

### Cliente principal — Instructores / Escuelas de baile
- Tienen grupos regulares (10–30 alumnos por clase)
- Organizan torneos internos semanales o mensuales
- Ya pagan por herramientas (música, apps de gestión)
- Dispuestos a pagar si la herramienta les ahorra tiempo y da imagen profesional

### Cliente secundario — Organizadores de competencias
- Eventos locales/regionales de salsa, bachata, kizomba
- Necesitan sistema de brackets, resultados en tiempo real, imagen de marca
- Mayor disposición a pagar por evento (modelo pago por uso)

### Cliente terciario — Academias grandes / Franquicias
- Múltiples instructores bajo una misma marca
- Necesitan dashboard de admin, múltiples torneos simultáneos
- Modelo de equipo/empresa

---

## 2. Modelos de cobro (opciones)

### Opción A — Suscripción mensual (RECOMENDADA para empezar)

| Plan | Precio | Límites | Para quién |
|------|--------|---------|------------|
| **Free** | $0 | 1 torneo activo, 8 competidores, sin historial | Probar |
| **Pro** | $9/mes | Torneos ilimitados, 30 competidores, historial, Spotify | Instructores |
| **Studio** | $19/mes | Todo Pro + multi-juez, exportar PDF, sin branding | Escuelas |
| **Event** | $49/evento | Studio por 24h, soporte prioritario | Competencias |

**¿Por qué suscripción?**
- Ingreso predecible mes a mes
- Retención alta si usan la app regularmente
- Fácil de escalar

### Opción B — Pago por torneo
- $2–5 USD por torneo creado
- Bueno si el uso es esporádico
- Más difícil de cobrar, más fricción

### Opción C — Lifetime deal (lanzamiento)
- $49–99 USD pago único, acceso de por vida al plan Pro
- Ideal para conseguir los primeros 50–100 clientes rápido
- Vender en AppSumo o directamente
- Riesgo: te comprometes a mantenerlo sin ingreso recurrente

**Recomendación**: empieza con Lifetime Deal para validar, luego migra a suscripción mensual.

---

## 3. ¿Cuánto podrías ganar?

### Escenario conservador (6 meses)
- 30 usuarios Pro a $9/mes = **$270/mes**
- 5 usuarios Studio a $19/mes = **$95/mes**
- Total: **~$365/mes**

### Escenario medio (12 meses con marketing activo)
- 100 Pro + 20 Studio + 5 Event/mes
- **~$1,300–1,800 USD/mes**

### Escenario optimista (comunidad salsa internacional)
- La comunidad de salsa es global (México, Colombia, España, USA)
- 500 usuarios Pro = **$4,500/mes**
- Con eventos regionales = **$6,000–10,000/mes**

---

## 4. Qué necesitas técnicamente para cobrar

### Paso 1 — Stripe (pagos) ✅ Prioritario
```
npm install @stripe/stripe-js stripe
```
- Crear cuenta en stripe.com
- Configurar productos y precios en el dashboard de Stripe
- Integrar Stripe Checkout (lo más simple: redirect a página de Stripe)
- Webhook para activar plan tras pago exitoso
- Guardar `stripe_customer_id` y `plan` en tabla `profiles` de Supabase

**Tiempo estimado**: 1–2 días de desarrollo

### Paso 2 — Control de acceso por plan (Feature Flags)
```js
// src/hooks/usePlan.js
export function usePlan() {
  const { profile } = useAuth()
  const plan = profile?.plan ?? 'free'
  return {
    isFree: plan === 'free',
    isPro: ['pro', 'studio'].includes(plan),
    isStudio: plan === 'studio',
    maxCompetitors: plan === 'free' ? 8 : plan === 'pro' ? 30 : 999,
    hasHistory: plan !== 'free',
    hasMultiJudge: plan === 'studio',
  }
}
```
Limitar features en los componentes según el plan.

### Paso 3 — Landing page
- Dominio propio (ej. clashpro.app — revisar disponibilidad)
- Página simple con: problema → solución → precios → testimonios → CTA
- Puede ser una página en Vercel (misma cuenta)
- Herramienta rápida: Framer, Webflow, o una página React adicional

### Paso 4 — Email / Comunicación
- Resend o SendGrid para emails transaccionales (confirmación de pago, etc.)
- Un boletín simple (MailerLite gratuito hasta 1,000 suscriptores)

---

## 5. Stack de negocio mínimo para lanzar

| Herramienta | Costo | Para qué |
|-------------|-------|---------|
| **Stripe** | 2.9% + $0.30 por transacción | Cobros |
| **Resend** | Gratis hasta 3,000 emails/mes | Emails transaccionales |
| **Vercel** | Gratis (hobby) o $20/mes (pro) | Deploy |
| **Supabase** | Gratis hasta 500MB | Base de datos |
| **Dominio** | ~$12/año | Identidad (clashpro.app) |
| **Total fijo** | ~$0–32/mes | Hasta que escales |

El costo fijo inicial es prácticamente $0 si usas los tiers gratuitos.

---

## 6. Roadmap para lanzar en 60 días

### Semanas 1–2: Producto Pro mínimo
- [ ] Feature flags por plan
- [ ] Stripe Checkout integrado
- [ ] Plan Pro: torneos ilimitados + historial básico
- [ ] Pantalla de upgrade dentro de la app

### Semanas 3–4: Landing page + primeros usuarios
- [ ] Landing page simple (clashpro.app)
- [ ] 5–10 beta testers de tu comunidad Salsanamá (gratis)
- [ ] Recopilar feedback

### Semanas 5–6: Lanzamiento suave
- [ ] Lifetime Deal $49 para los primeros 50 clientes
- [ ] Post en grupos de Facebook de salsa (México, España, Colombia)
- [ ] Video demo en Instagram/TikTok mostrando la app en acción
- [ ] Contactar directamente a 20 escuelas de salsa vía DM

### Semanas 7–8: Iteración
- [ ] Ajustar precios según conversión
- [ ] Agregar feature más pedida por beta testers
- [ ] Activar suscripción mensual

---

## 7. Canales de adquisición (sin gastar en ads)

1. **Comunidad Salsanamá** — tu base ya existente, primeros 10–20 clientes garantizados
2. **Grupos de Facebook** — "Salsa en México", "Instructores de Baile LATAM" etc. — millones de miembros
3. **Instagram/TikTok** — video de 30s mostrando un torneo en vivo con la app
4. **Reddit** — r/salsa, r/dancesport
5. **Contacto directo** — mensaje a escuelas de salsa locales ofreciendo prueba gratis
6. **ProductHunt** — lanzar cuando esté estable (acceso a comunidad tech global)
7. **YouTube tutoriales** — "cómo organizar un torneo de salsa" — SEO a largo plazo

---

## 8. Ventaja competitiva

No existe ninguna app similar para torneos de baile de salsa improvisación.
Las alternativas son:
- Hojas de Excel manuales
- Challonge/Battlefy (para esports, no baile)
- Papel y lápiz

**Tu diferenciador**: hecho por alguien de la comunidad salsa, integración Spotify, interfaz mobile-first, sin fricción.

---

## 9. Riesgos y cómo mitigarlos

| Riesgo | Mitigación |
|--------|-----------|
| Pocos usuarios paguen | Lifetime Deal primero para validar |
| Spotify revoca API | Tener playlists hardcodeadas como fallback |
| Alguien lo copia | Comunidad + velocidad de iteración son tu moat |
| Costo de Supabase sube | Migrar a self-hosted si llegas a 1,000+ users |
| Churn alto | Agregar features de retención (historial, stats) |

---

## 10. Siguiente acción concreta

**Esta semana**:
1. Registrar dominio `clashpro.app` (~$12/año en Namecheap)
2. Crear cuenta en Stripe
3. Hablar con 5 instructores de Salsanamá y preguntar si pagarían y cuánto

**No hacer todavía**: landing page elaborada, invertir en ads, app stores.
Primero valida que alguien pague.
