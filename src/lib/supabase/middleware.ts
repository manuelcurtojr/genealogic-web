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

  // Protected routes — redirect to login if not authenticated
  const isProtectedRoute = !isDogDetailPage && !isKennelDetailPage && !isLitterDetailPage && (
    request.nextUrl.pathname.startsWith('/dogs') ||
    request.nextUrl.pathname.startsWith('/kennel') ||
    request.nextUrl.pathname.startsWith('/litters') ||
    request.nextUrl.pathname.startsWith('/calendar') ||
    request.nextUrl.pathname.startsWith('/crm') ||
    request.nextUrl.pathname.startsWith('/import') ||
    request.nextUrl.pathname.startsWith('/favorites') ||
    request.nextUrl.pathname.startsWith('/planner') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/analytics')
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Auth routes — redirect to dashboard if already logged in
  const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register'
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dogs'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
