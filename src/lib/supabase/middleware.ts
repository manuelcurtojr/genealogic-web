import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  getPlatformFromRequest,
  isIosAllowedException,
  isIosAllowedForAnon,
  matchesIosHiddenPath,
  shouldBypassPlatformLogic,
} from '@/lib/platform'
import { hasProAccess, isEnterpriseUser } from '@/lib/permissions'
import { isReservedPath, isInsider } from '@/lib/features/launch'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ─── Platform detection (Capacitor iOS WebView) ────────────────────────
  // Identificamos al wrapper iOS por el User-Agent suffix `GenealogicIOSApp`
  // que Capacitor añade en cada request. Sin redirects ni query params en
  // el path crítico — eso provocaba que WKWebView abriera externamente.

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ─── iOS WebView gating ────────────────────────────────────────────────
  // La app debe sentirse nativa: si no estás logueado, sólo ves auth pages.
  // Si estás logueado, se ocultan las rutas B2B (pricing/billing/CRM) que
  // disparan 3.1.1. Antes que el resto de gates para evitar ciclos.
  const isIosSession = getPlatformFromRequest(request) === 'ios'
  if (isIosSession && !shouldBypassPlatformLogic(pathname)) {
    // 1. Anon → solo login/register/forgot/reset/legal. Todo lo demás a /login.
    if (!user && !isIosAllowedForAnon(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = ''
      return NextResponse.redirect(url)
    }
    // 2. Logueado → bloquear rutas B2B (pricing, billing, CRM, etc.).
    if (
      user &&
      matchesIosHiddenPath(pathname) &&
      !isIosAllowedException(pathname)
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  // Public dog detail pages (e.g. /dogs/uuid) and public kennel pages.
  // Para kennels: TODO `/kennels/[slug]/*` es público (home + perros
  // + contacto). El
  // middleware tenía aquí una regex que solo dejaba el detail level-1
  // (`/kennels/[slug]`) y mandaba a login en cualquier subpágina —
  // rompía la navegación de la web Pro para visitantes no logueados.
  const isDogDetailPage = /^\/dogs\/[^/]+$/.test(pathname)
  const isKennelDetailPage = pathname.startsWith('/kennels/')
  const isLitterDetailPage = /^\/litters\/[^/]+$/.test(pathname)
  const isPricingPage = pathname === '/pricing'
  const isSearchPage = pathname === '/search'
  const isKennelDirectoryPage = pathname === '/kennels'

  // Rutas Pro (requieren plan kennel_pro o estar en ENTERPRISE_USERS)
  // Reservas se mueve fuera de Pro: cualquier criador con kennel puede ver
  // sus solicitudes. La vista Free es simplificada (bandeja); Pro desbloquea
  // pipeline avanzado, contactos y contratos (que sí siguen Pro).
  const proRoutePrefixes = [
    '/clientes', '/contactos', '/contratos',
    '/estadisticas', '/visitas', '/cuenta',
  ]
  // EXCEPCIONES dentro de las rutas Pro:
  //  - /cuenta/suscripcion — accesible para FREE (entrada al upgrade desde
  //    el flujo signup→register?plan=pro→kennel/new→activar plan)
  const isUpgradeEntryPath = pathname === '/cuenta/suscripcion' || pathname.startsWith('/cuenta/suscripcion/')
  const isProException = isUpgradeEntryPath
  const isProRoute = !isProException && proRoutePrefixes.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Protected routes — redirect to login if not authenticated
  const isProtectedRoute = !isDogDetailPage && !isKennelDetailPage && !isKennelDirectoryPage && !isLitterDetailPage && !isPricingPage && !isSearchPage && (
    pathname.startsWith('/dogs') ||
    pathname.startsWith('/kennel') ||
    pathname.startsWith('/litters') ||
    pathname.startsWith('/planner') ||
    pathname.startsWith('/cruces') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/import') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/vet') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    isProRoute
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ─── Carta reducida (Fase 1): rutas RESERVADAS, no lanzadas al público ──
  // Las features construidas-pero-no-lanzadas (ver lib/features/launch.ts) solo
  // son accesibles para INSIDERS (Irema, El Nieto vía ENTERPRISE_USERS). El
  // resto de usuarios logueados → /dashboard. Al lanzar una feature, se quita
  // de RESERVED_PATHS y queda abierta para todos. (Logout ya cae en el gate de
  // ruta protegida de arriba.)
  if (user && isReservedPath(pathname) && !isInsider(user.id)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Auth routes — redirect logged-in users (admins → /admin, others → /dashboard)
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  if (isAuthRoute && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Pro route gating — usuarios sin plan de pago van a /pricing.
  // Usamos hasProAccess() (alias actual de hasPaidPlan: cualquier plan
  // de pago — kennel, kennel_pro y legacy pro/premium/starter) y el
  // override ENTERPRISE_USERS (cuentas founder / partners con todo
  // desbloqueado independientemente del plan en DB).
  if (isProRoute && user) {
    if (!isEnterpriseUser(user.id)) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plan = (profile as any)?.plan
      if (!hasProAccess(plan)) {
        const url = request.nextUrl.clone()
        url.pathname = '/pricing'
        return NextResponse.redirect(url)
      }
    }
  }

  // ─── Captura UTM / referrer en cookie first-touch ───────────────────
  // Si el visitante llega con ?utm_* o desde un dominio externo, guardamos
  // los params + referrer + landing_page en una cookie httpOnly durante 30
  // días. Al registrarse, /api/track-signup la lee y persiste en
  // profiles.signup_meta. Así sabemos de dónde vienen los usuarios sin
  // depender de localStorage (que se pierde en sesiones distintas).
  const url = request.nextUrl
  const sp = url.searchParams
  const hasUtm = sp.has('utm_source') || sp.has('utm_medium') || sp.has('utm_campaign')
  const existingMeta = request.cookies.get('signup_meta')?.value

  if (hasUtm || !existingMeta) {
    // Solo escribimos si NO hay cookie todavía (respetamos first-touch) o
    // si llegan UTM nuevos explícitos.
    const referrer = request.headers.get('referer') || ''
    const meta: Record<string, string> = {}
    if (sp.get('utm_source')) meta.utm_source = sp.get('utm_source')!
    if (sp.get('utm_medium')) meta.utm_medium = sp.get('utm_medium')!
    if (sp.get('utm_campaign')) meta.utm_campaign = sp.get('utm_campaign')!
    if (sp.get('utm_term')) meta.utm_term = sp.get('utm_term')!
    if (sp.get('utm_content')) meta.utm_content = sp.get('utm_content')!
    if (referrer && !referrer.includes(url.host)) meta.referrer = referrer
    if (!meta.landing_page) meta.landing_page = url.pathname

    // Solo persistimos si tenemos algo útil que registrar
    if (Object.keys(meta).length > 0 && (hasUtm || !existingMeta)) {
      supabaseResponse.cookies.set('signup_meta', JSON.stringify(meta), {
        maxAge: 30 * 24 * 60 * 60, // 30 días
        httpOnly: false,           // accesible desde server actions + cliente
        sameSite: 'lax',
        path: '/',
      })
    }
  }

  // ─── Semilla de idioma desde Accept-Language (autodetección) ─────────
  // Si el visitante NO tiene aún cookie de idioma, la sembramos desde el
  // Accept-Language del navegador. Así los server components (header/footer/
  // landings públicas) ya renderizan en su idioma en el PRIMER hit, sin
  // depender de localStorage. El switcher del footer o /settings la
  // sobrescriben después con la preferencia explícita.
  const LOCALE_COOKIE = 'genealogic-lang'
  if (!request.cookies.get(LOCALE_COOKIE)) {
    const al = request.headers.get('accept-language')
    if (al) {
      // Primer idioma soportado por orden de q-value.
      const supported = ['es', 'en', 'fr', 'de', 'pt', 'it']
      const ranked = al
        .split(',')
        .map((p) => {
          const [tag, qPart] = p.trim().split(';')
          const q = qPart?.startsWith('q=') ? parseFloat(qPart.slice(2)) : 1
          return { base: tag.trim().toLowerCase().split('-')[0], q: Number.isFinite(q) ? q : 1 }
        })
        .sort((a, b) => b.q - a.q)
      const detected = ranked.find((r) => supported.includes(r.base))?.base
      if (detected) {
        supabaseResponse.cookies.set(LOCALE_COOKIE, detected, {
          maxAge: 60 * 60 * 24 * 365, // 1 año
          httpOnly: false,            // getLocale (server) + getTranslator (client) la leen
          sameSite: 'lax',
          path: '/',
        })
      }
    }
  }

  return supabaseResponse
}
