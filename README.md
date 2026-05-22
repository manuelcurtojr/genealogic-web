# Genealogic

SaaS de pedigrees caninos. Plataforma para criadores y dueños donde gestionar perros, genealogías verificables, camadas, salud, y — en tier Pro — operativa completa de criadero (reservas, clientes, emailbot, web pública, newsletter, estadísticas).

Producción: [genealogic.io](https://www.genealogic.io)

## Stack

- **Next.js 14** App Router (Server Components + Server Actions)
- **TypeScript** estricto
- **Supabase** — Postgres + Auth + Storage + RLS
- **Tailwind v4** con tokens CSS (`@theme`) inspirados en Cal.com
- **Anthropic SDK** (`claude-sonnet-4-5`) — import de pedigrees y emailbot
- **Stripe** (REST, sin SDK) — facturación tier Pro
- **Vercel** — hosting + Image Optimization + Domains API (custom domains)
- **Resend Inbound** — webhook entrante para emailbot
- **Capacitor** — wrap iOS/Android para push notifications
- **@dnd-kit** — drag&drop en pipeline de reservas y editor web
- **jspdf / html2canvas** — export PDF (pedigrees, contratos)
- **recharts** — gráficas de analytics

## Modelo de negocio

| Tier | Precio | Quién |
|------|--------|-------|
| **Free** | 0 € | Dueños y criadores hobby. Gestión de perros, genealogía, búsqueda, planner. |
| **Pro** | Founder pricing en curso | Criadores profesionales. Todo lo de Free + pipeline de reservas, CRM clientes, emailbot, biblioteca, web pública con dominio propio, newsletter, estadísticas. |
| **Admin** | – | Rol interno de plataforma. |

El plan vive en `profiles.plan` (`free|starter|pro|premium`) + flag `plan_is_founder`. La función `hasProAccess(plan)` en `src/lib/permissions.ts` gobierna lo que se ve.

## Estructura del proyecto

```
src/
  app/
    (auth)/         · login, register, forgot-password, reset-password
    (public)/       · landing, pricing, api-docs
    (dashboard)/    · todo lo que requiere sesión
      dashboard/    · escritorio del usuario
      dogs/         · CRUD perros + pedigree viewer + import
      litters/      · camadas
      planner/      · planificador de cruces
      calendar/     · calendario celos / partos / citas
      reservas/     · [Pro] pipeline kanban de reservas de cachorros
      clientes/     · [Pro] CRM de owners/compradores
      emailbot/     · [Pro] asistente IA para correos entrantes
      conocimiento/ · [Pro] biblioteca para alimentar al bot
      newsletter/   · [Pro] subscribers + campañas
      estadisticas/ · [Pro] page views / conversion
      web/          · [Pro] editor visual de la web pública del criadero
      cuenta/       · suscripción, facturación, dominio
      settings/     · ajustes generales
      admin/        · panel admin (solo role='admin')
    api/
      v1/           · API pública con auth por kennel API key (api-auth.ts)
      admin/        · operaciones admin (delete con allowlist)
      import-pedigree/    · proxy Anthropic (no expone API key)
      confirm-import/     · graba el árbol importado en DB
      push/send/          · push notifications con check de relación
      proxy-fetch/        · scraping de fuentes públicas (allowlist hostname)
      reservations/, owners/, knowledge/, emailbot/, newsletter/, billing/, domain/
    c/[slug]/...    · render público del sitio del criadero
  components/
    site/sections/  · 36 secciones del web builder (hero, dogs, services, ...)
    admin/web/      · editor visual (panel izq de árbol + canvas + panel der de props)
    reservas/       · board kanban
    clientes/       · tabla + slide panel
    pedigree/       · árbol genealógico SVG
    layout/         · sidebar, command bar (⌘K), shell
    ui/             · primitivos (slide-panel, confirm-dialog, searchable-select…)
  lib/
    supabase/       · server/client/middleware factories
    kennel/         · helpers de datos y media para el web builder
    kennel-context.ts · AsyncLocalStorage para propagar kennel actual en RSC
    permissions.ts  · isPro / hasProAccess / isAdmin
    constants.ts    · NAV_SECTIONS (con flags requiresPro/requiresKennel)
    commands.ts     · catálogo del Command Bar ⌘K
    stripe.ts       · helpers REST sin SDK
    push.ts         · APNs/FCM via Supabase Edge Function
    api-auth.ts     · auth por API key para /api/v1
supabase/migrations · histórico de schema
scripts             · utilidades one-off (importar fotos Irema, etc.)
```

## Multi-kennel y dominios

- Un usuario puede ser dueño de **un kennel** (tier Pro). El sidebar muestra/oculta items según `hasProAccess(plan)` y `kennel` presence.
- **Custom domain**: el middleware (`src/middleware.ts`) detecta el host de la request y, si matchea con `kennels.custom_domain`, reescribe a `/c/[slug]/…`. El propio dominio del criador termina sirviendo el sitio público generado con el editor visual.
- Vercel Domains API gestiona alta/baja desde `/cuenta/dominio`.

## Web Builder

Editor visual tipo Webflow-lite portado desde Pawdoq Breeders. Vive en `(dashboard)/web/`.

- **8 páginas troncales** preestablecidas por kennel (`home`, `perros`, `razas`, `historia`, `servicios`, `instalaciones`, `blog`, `contacto`) garantizadas por `ensureAllPages()`.
- **Secciones** como JSONB en `kennel_pages.sections`. ~36 tipos (`hero`, `dog-cards`, `featured-dogs`, `services-grid`, `cta-banner`, `contact-form`, etc.).
- **Drafts vs published**: cada page tiene `sections` (publicado) y `draft_sections`. El preview iframe carga el draft con un cookie flag.
- **Undo/Redo** con tabla `kennel_pages_history` (snapshot por edición).
- **Layout 3 columnas**: árbol de secciones (izq) · canvas iframe (centro) · props panel (der). Los paneles laterales son plegables (`EditorPanelsContext`).
- **MediaPicker** con 3 fuentes: subir desde dispositivo, biblioteca del kennel, URL externa.
- **Drag&drop** de reordenación con `@dnd-kit/sortable`.

## Pipeline de reservas (Pro)

Tabla `puppy_reservations` con states: `interested → waitlisted → deposit_paid → assigned → contract_signed → paid_in_full → delivered` (+ `cancelled`).

Render kanban en `/reservas` con tarjetas arrastrables entre columnas. Cada tarjeta enlaza con un `owner` (CRM) y opcionalmente con un `litter` y un `dog`.

## Emailbot (Pro)

- Webhook Resend Inbound recibe correos a la dirección del criador.
- Cada thread se persiste en `email_threads` / `email_messages`.
- El bot (Anthropic) tiene como contexto la **biblioteca de conocimiento** (`knowledge_articles`) que el criador rellena.
- Página de **Test** para conversar con el bot fuera de correo real.
- Página de **Hilos** para revisar conversaciones reales y editar antes de enviar.

## Command Bar (⌘K)

Buscador global en `src/components/layout/command-bar.tsx`. Catálogo en `src/lib/commands.ts`. Filtra navegación, perros, kennels, ajustes — todo según permisos del user.

## Sidebar minimalista

Solo 4-7 items visibles según rol y tier:

- **Free**: Escritorio · Mis Perros · (si tiene kennel) Camadas · Calendario
- **Pro**: Escritorio · Mis Perros · Reservas · Clientes · Web
- **Admin**: además, link al panel `/admin`

Todo lo demás (Planner, Vet, Search, Newsletter, Estadísticas, Biblioteca, Hilos, Test, Suscripción, Facturación, Dominio, etc.) se invoca por **⌘K**.

## Seguridad

Endpoints sensibles ya hardenizados (ver `fix/everything` branch):

- `/api/import-pedigree` — proxy server-side a Anthropic, nunca expone `ANTHROPIC_API_KEY`. Rate limit 5s/user.
- `/api/push/send` — solo self-push o relación verificada (admin, dueño de kennel con dog owner/contributor, owner por email).
- `/api/admin/delete` — allowlist explícito `{dogs, kennels, litters, profiles}` + validación UUID.
- `/api/v1/*` — auth por kennel API key (header `x-api-key`), clamp en `limit/offset`.
- `/api/confirm-import` — UUIDs validados antes de interpolar en `.or()` / `.in()`.
- `/api/proxy-fetch` — allowlist con `hostname === d || endsWith('.'+d)`, protocolo http/https only.

RLS activado en todas las tablas con datos por kennel. Helper `is_admin()` en SQL para bypass admin.

## Setup local

```bash
# Requisitos: Node ≥ 20, cuenta Supabase

cp .env.local.example .env.local   # rellenar con keys de tu proyecto Supabase
npm install
npm run dev
```

Variables clave:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-only, NO exponer
ANTHROPIC_API_KEY=                 # opcional, fallback en platform_settings
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
VERCEL_API_TOKEN=                  # para Domains API
```

Aplicar migrations:

```bash
# con Supabase CLI linkado al proyecto
supabase db push
```

## Deployment

Push a `main` → Vercel deploya automáticamente. Branches feature/* generan preview URLs.

Imágenes optimizadas vía Vercel Image Optimization. Hostnames permitidos en `next.config.mjs`.

## Scripts útiles

```bash
npm run dev     # dev server (limpia .next antes)
npm run build   # build de producción
npm run start   # serve build local
npm run lint    # ESLint
```

`scripts/` contiene importadores one-off (Irema Curtó user 0, sus imágenes, etc.) — referencia, no production.

## Convenciones

- **Server Components por defecto**. `'use client'` solo donde haga falta interactividad real.
- **Server Actions** en `actions.ts` colocalizado con la page.
- **Tokens Cal.com**: `ink`, `body`, `muted`, `hairline`, `canvas`, `surface-card`, `surface-soft`. Nada de `gray-500`/`zinc-X` sueltos.
- **Naming en español** para UI visible al user. Inglés para código/identificadores.
- **No fonts customizadas más allá de Inter** + JetBrains Mono para code.

## Licencia

Privado. © Manuel Curtó Jr.
