# Genealogic — guía para agentes (Claude Code)

## ⚠️ VARIAS SESIONES A LA VEZ — coordinación obligatoria

Casi siempre hay **2+ sesiones de Claude Code trabajando sobre ESTA MISMA
carpeta al mismo tiempo**. Para no pisaros los commits ni el build, TODA sesión
debe cumplir estas reglas SIEMPRE:

### 1. Git — PROHIBIDO `git add -A`, `git add .` y `git commit -a`
- Antes de commitear: ejecuta `git status` y **añade SOLO tus archivos, por ruta
  explícita** → `git add src/ruta/exacta.tsx otra/ruta.ts`
- `git add -A` / `git add .` / `git commit -a` **se tragan los cambios sin
  commitear de la otra sesión** y los mezclan en tu commit con un mensaje que no
  les corresponde. No lo hagas NUNCA.
- Si en `git status` aparecen archivos que tú no has tocado, son de la otra
  sesión: **déjalos como están**, no los añadas.
- Después de commitear lo tuyo, `git push`. Si lo rechaza (la otra sesión pusheó
  antes): `git pull --rebase && git push`.

### 2. Build — NO ejecutes `next build` en local; cuidado con `next dev`
- El directorio `.next` es **compartido**. Dos builds (o un build + un dev) a la
  vez lo corrompen → errores tipo `ENOENT ... next-font-manifest.json` o
  `build-manifest.json`. No es tu código, es la contención.
- Para verificar tus cambios usa **`npx tsc --noEmit`** (no toca `.next`).
- El build de verdad lo hace **Vercel al pushear**, en entorno aislado. No hace
  falta buildear en local.
- Si necesitas previsualizar con `next dev`, que lo levante **UNA sola sesión** y
  que NINGUNA otra haga `build`/`dev` mientras tanto.

### 3. Antes de un cambio grande
- Mira `git log --oneline -5` para ver en qué anda la otra sesión y no tocar el
  mismo archivo a la vez. Si vais a tocar lo mismo, repartíoslo.

---

## Proyecto — básicos

- **Deploy**: Vercel despliega automáticamente al pushear a `main`. Push = deploy.
- **Stack**: Next.js 14 (App Router, `force-dynamic`) · Supabase (RLS) · Resend
  (emails) · Tailwind v4 · Vercel.
- **Copy público en español**: NUNCA digas "pedigree/pedigrees" → usa
  **"genealogías"**. (Única excepción: citar el PDF oficial de un club, p. ej.
  "pedigree oficial de FCI/AKC".)
- **Owner-first**: la plataforma es para PROPIETARIOS, impulsada por criadores.
  Un usuario es criador solo si tiene criadero (kennel); el resto es propietario.
- **Supabase Management API**: token en `/Users/duulii/Documents/Pawdoq/.env.local`
  (`SUPABASE_ACCESS_TOKEN`). Project ref: `elhwppumacnyhovkapeb`. Útil para
  inspeccionar/migrar la BBDD vía `POST .../v1/projects/<ref>/database/query`.
- **Migraciones**: versiónalas en `supabase/migrations/` (formato `2026XXXX_*.sql`).
