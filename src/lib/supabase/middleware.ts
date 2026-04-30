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

  // Public dog detail pages (e.g. /dogs/uuid) and public kennel pages
  const isDogDetailPage = /^\/dogs\/[^/]+$/.test(request.nextUrl.pathname)
  const isKennelDetailPage = /^\/kennels\/[^/]+$/.test(request.nextUrl.pathname)
  const isLitterDetailPage = /^\/litters\/[^/]+$/.test(request.nextUrl.pathname)
  const isPricingPage = request.nextUrl.pathname === '/pricing'
  const isSearchPage = request.nextUrl.pathname === '/search'
  const isKennelDirectoryPage = request.nextUrl.pathname === '/kennels'

  // Protected routes — redirect to login if not authenticated
  const isProtectedRoute = !isDogDetailPage && !isKennelDetailPage && !isKennelDirectoryPage && !isLitterDetailPage && !isPricingPage && !isSearchPage && (
    request.nextUrl.pathname.startsWith('/dogs') ||
    request.nextUrl.pathname.startsWith('/kennel') ||
    request.nextUrl.pathname.startsWith('/litters') ||
    request.nextUrl.pathname.startsWith('/planner') ||
    request.nextUrl.pathname.startsWith('/import') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/analytics') ||
    request.nextUrl.pathname.startsWith('/vet') ||
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/admin')
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Auth routes — redirect logged-in users (admins → /admin, others → /dashboard)
  const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register'
  if (isAuthRoute && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
