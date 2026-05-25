/**
 * Gestión del "signup intent" — qué quiere hacer el user al registrarse.
 *
 * Origen: query params en /register o /login (`?intent=breeder|buyer&plan=free|pro|premium`).
 *
 * Persistencia necesaria porque:
 *  - El OAuth con Google sale del dominio (window.location.href cambia)
 *  - El email confirmation tarda en llegar
 *  - El usuario puede cerrar la pestaña y volver
 *
 * Estrategia híbrida:
 *  1. Cookie (sobrevive a redirects/full reload, accesible desde server)
 *  2. sessionStorage (fallback inmediato en cliente sin esperar set-cookie)
 *
 * Ambos se borran en cuanto se "consume" el intent (típicamente al
 * redirigir al sitio final correcto desde /dashboard).
 */

export type SignupIntent = 'breeder' | 'buyer' | 'owner'
export type SignupPlan = 'free' | 'pro' | 'premium'

export type SignupIntentData = {
  intent: SignupIntent
  plan: SignupPlan
}

const COOKIE_NAME = 'genealogic_signup_intent'
const SESSION_KEY = 'genealogic_signup_intent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

// 'owner' = nuevo (alineado con profiles.onboarding_intent)
// 'buyer' = legacy (mantenido por compatibilidad con URLs antiguas).
//   Internamente se trata como 'owner'.
const VALID_INTENTS: SignupIntent[] = ['breeder', 'buyer', 'owner']
const VALID_PLANS: SignupPlan[] = ['free', 'pro', 'premium']

/** Lee intent de query params, normaliza, devuelve null si inválido. */
export function parseIntentFromQuery(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): SignupIntentData | null {
  const get = (k: string): string | null => {
    if (searchParams instanceof URLSearchParams) return searchParams.get(k)
    const v = searchParams[k]
    if (Array.isArray(v)) return v[0] ?? null
    return v ?? null
  }
  const intentRaw = get('intent')
  const planRaw = get('plan')
  if (!intentRaw && !planRaw) return null

  const intent: SignupIntent = VALID_INTENTS.includes(intentRaw as SignupIntent)
    ? (intentRaw as SignupIntent)
    : 'breeder'
  const plan: SignupPlan = VALID_PLANS.includes(planRaw as SignupPlan)
    ? (planRaw as SignupPlan)
    : 'free'
  return { intent, plan }
}

// ─── CLIENT-SIDE persistence ────────────────────────────────────────────────

export function saveIntentClient(data: SignupIntentData): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {}
  // Cookie (accesible desde server después del redirect)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function readIntentClient(): SignupIntentData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw) as SignupIntentData
  } catch {}
  // Fallback a cookie
  const m = document.cookie.match(new RegExp(`(?:^| )${COOKIE_NAME}=([^;]+)`))
  if (m) {
    try { return JSON.parse(decodeURIComponent(m[1])) as SignupIntentData } catch {}
  }
  return null
}

export function clearIntentClient(): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

// ─── SERVER-SIDE persistence (cookies de Next) ──────────────────────────────

/** Lee intent desde cookies del request. Server-only. */
export async function readIntentServer(): Promise<SignupIntentData | null> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(raw)) as SignupIntentData
  } catch {
    return null
  }
}

/**
 * Decide la URL de destino post-signup basándose en el intent.
 * Si no hay intent, fallback a /dashboard (comportamiento legacy).
 */
export function destinationForIntent(data: SignupIntentData | null): string {
  if (!data) return '/dashboard'
  // 'buyer' (legacy) y 'owner' van al dashboard que ya detecta su rol
  // y muestra el WelcomeOwner con el checklist correspondiente.
  if (data.intent === 'buyer' || data.intent === 'owner') return '/dashboard'
  // breeder: va directo a crear kennel; el plan se propaga para activar
  // después de crear el afijo
  const planParam = data.plan !== 'free' ? `?plan=${data.plan}` : ''
  return `/kennel/new${planParam}`
}

/**
 * Mapea el SignupIntent al valor de profiles.onboarding_intent.
 * - 'breeder' → 'breeder'
 * - 'owner' o 'buyer' → 'owner'
 *
 * Devuelve null si no aplica (no intent provided).
 */
export function intentToOnboardingIntent(
  data: SignupIntentData | null,
): 'breeder' | 'owner' | null {
  if (!data) return null
  if (data.intent === 'breeder') return 'breeder'
  return 'owner' // 'owner' o 'buyer' (legacy)
}
