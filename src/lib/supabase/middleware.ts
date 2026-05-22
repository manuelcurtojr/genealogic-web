import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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

  // Public dog detail pages (e.g. /dogs/uuid) and public kennel pages
  const isDogDetailPage = /^\/dogs\/[^/]+$/.test(pathname)
  const isKennelDetailPage = /^\/kennels\/[^/]+$/.test(pathname)
  const isLitterDetailPage = /^\/litters\/[^/]+$/.test(pathname)
  const isPricingPage = pathname === '/pricing'
  const isSearchPage = pathname === '/search'
  const isKennelDirectoryPage = pathname === '/kennels'

  // Rutas Pro (requieren plan = 'pro' o 'premium')
  const proRoutePrefixes = [
    '/reservas', '/clientes', '/emailbot', '/conocimiento',
    '/web', '/estadisticas', '/newsletter', '/cuenta',
  ]
  const isProRoute = proRoutePrefixes.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Protected routes — redirect to login if not authenticated
  const isProtectedRoute = !isDogDetailPage && !isKennelDetailPage && !isKennelDirectoryPage && !isLitterDetailPage && !isPricingPage && !isSearchPage && (
    pathname.startsWith('/dogs') ||
    pathname.startsWith('/kennel') ||
    pathname.startsWith('/litters') ||
    pathname.startsWith('/planner') ||
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

  // Auth routes — redirect logged-in users (admins → /admin, others → /dashboard)
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  if (isAuthRoute && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Pro route gating — usuarios sin plan pro/premium van a /pricing
  if (isProRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    const plan = (profile as any)?.plan
    if (plan !== 'pro' && plan !== 'premium') {
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
