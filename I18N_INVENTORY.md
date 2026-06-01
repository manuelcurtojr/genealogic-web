# Inventario i18n ES→EN · Genealogic

> Generado 2026-06-01. Mapeo exhaustivo previo a internacionalizar la plataforma a inglés.
> Objetivo del usuario: web bilingüe ES/EN, autodetección por navegador, switcher en footer (anónimo) + ajustes (logueado).

## TL;DR de magnitud

| Métrica | Valor |
|---|---|
| Archivos `.tsx` en `src` | **442** |
| Líneas `.tsx` totales | **~80.900** |
| Páginas (`page.tsx`) | **131** |
| Layouts | 13 |
| Componentes (`src/components`) | 242 |
| Plantillas email | 23 |
| `generateMetadata` (SEO) | 15 páginas |
| Mensajes de error API (español) | ~182 ocurrencias |
| Formateo `es-ES` hardcodeado | 132 ocurrencias en ~9 libs |
| Strings UI hardcodeados (estimado) | **800-1000** |

## ⚡ HALLAZGO CLAVE: ya hay infraestructura i18n a medias

**`src/lib/i18n.ts` (530 líneas) YA EXISTE** y está parcialmente conectado:
- Soporta `es` (default), `en`, `fr`, `de`, `pt`, `it` — **el inglés ya tiene ~200 keys traducidas**.
- Función `getTranslator(lang)` → `t(key)` con fallback a la clave española.
- `src/app/(dashboard)/settings/page.tsx` YA tiene selector de idioma: lee/escribe `profiles.language`, guarda en `localStorage('genealogic-lang')`, y refresca.
- `src/components/layout/sidebar.tsx` YA usa `getTranslator` → la nav del dashboard logueado ya es multi-idioma.
- `profiles.language` **SÍ existe** (lo usa settings); el campo está vivo, no muerto.

**Implicación:** el trabajo NO es construir i18n de cero, sino **(a) extender el diccionario** a las zonas no cubiertas y **(b) conectar los componentes que aún hardcodean**. La fontanería ya está tendida.

### Lo que i18n.ts YA cubre
Nav dashboard, acciones (Guardar/Cancelar/Editar/Eliminar), labels de perro (Macho/Hembra/Nombre/Raza/Padre/Madre), camadas, vet, calendario, CRM, búsqueda, filtros, auth, settings. ~200 keys.

### Lo que i18n.ts NO cubre (el trabajo pendiente)
- **Metadata SEO** (15 páginas con title/description hardcodeado en español)
- **Header público + footer marketing** (lo que ve el anónimo — `public-header.tsx`, `marketing-footer.tsx` NO usan `t()`)
- **Landings de marketing** (home, features, criadores, propietarios, pricing)
- **Pricing**: ~59 descripciones de features en `pricing-client.tsx`
- **Onboarding** (welcome-owner, welcome-no-kennel, role-selector)
- **Kennel** (36 componentes, ~74 strings: pro-home, contact-form-builder, perros-catalog…)
- **Admin** (16 componentes, ~102 strings) — baja prioridad (interno)
- **Emails** (23 plantillas + 22 subjects, todo hardcodeado español)
- **~182 mensajes de error de API**
- **132 formateos `es-ES`** (fechas/números) a parametrizar por locale
- **Blog**: 15 posts TSX en español (`src/content/blog/posts/`)

## Arquitectura recomendada

**NO usar routing por locale (`/en/...`, `/es/...`).** Razón: la app ya tiene un sistema basado en `profiles.language` + `localStorage` + `getTranslator`. Reescribir a routing por path (next-intl con `[locale]`) obligaría a mover las 131 páginas dentro de `app/[locale]/` y romper el middleware host-aware de dominios propios (iremacurto.com). **Extender el sistema cookie/preference existente** es mucho menos invasivo.

**Decisión de idioma (cascada):**
1. Usuario logueado → `profiles.language`
2. Anónimo con preferencia → cookie `genealogic-lang` (la setea el switcher del footer)
3. Sin nada → `Accept-Language` del navegador (autodetección) → cookie
4. Fallback → `es`

**Switcher:**
- Footer (`marketing-footer.tsx`) para anónimos → setea cookie + recarga.
- Settings (ya existe) para logueados → `profiles.language` (definitivo).

**SEO:** como no hay rutas por locale, usar `<link rel="alternate" hreflang>` apuntando a la misma URL con cookie, o (mejor a futuro) evaluar rutas por locale solo para las páginas públicas indexables. Decisión pendiente con el usuario.

## Plan por fases (orden recomendado)

### Fase 0 — Fontanería (cimientos)
1. Middleware: detectar `Accept-Language` → set cookie `genealogic-lang` si no existe.
2. Server helper `getLocale()` que lee la cascada (profiles→cookie→accept-language→es).
3. `<html lang>` dinámico en root layout (hoy fijo `lang="es"`).
4. Switcher de idioma en `marketing-footer.tsx` (anónimo).

### Fase 1 — Lo que ve el ANÓNIMO (máxima prioridad, mercado EN)
Header público, footer, home, features, pricing, criadores, propietarios, razas, /search. + metadata SEO de esas páginas.

### Fase 2 — Onboarding + flujos de owner
welcome-owner, welcome-no-kennel, role-selector, dog-form, checklist. (El owner nuevo EN aterriza aquí.)

### Fase 3 — Emails
Refactor `sendTransactionalEmail` para aceptar `language`; crons leen `profiles.language`; traducir las 23 plantillas + 22 subjects. (owner-checkin primero — es el del caso Sean.)

### Fase 4 — Dashboard interno completo
Kennel (36), dogs, reservas, vet, reproducción… Completar el diccionario.

### Fase 5 — Admin + blog + long tail
Admin (interno, baja prioridad), 15 blog posts (¿traducir o dejar ES con nota?), API errors, formateos es-ES.

## Archivos núcleo a tocar en Fase 0
- `src/lib/i18n.ts` — extender diccionario
- `src/lib/supabase/middleware.ts` — detección Accept-Language
- `src/app/layout.tsx` — `<html lang>` dinámico + metadata
- `src/components/marketing/marketing-footer.tsx` — switcher
- `src/components/layout/public-header.tsx` — conectar `t()`
- (nuevo) `src/lib/locale.ts` — helper server-side de cascada de idioma
