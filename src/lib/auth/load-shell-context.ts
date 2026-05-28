/**
 * loadShellContext — carga TODA la data que DashboardShell necesita.
 *
 * Centraliza:
 *   - usuario actual + profile (display_name, plan, role, avatar)
 *   - kennel asociado
 *   - plan efectivo (con override Enterprise / founder)
 *   - roles efectivos (isClient, etc.)
 *
 * Usado por (dashboard)/layout.tsx Y por (public)/layout.tsx +
 * (legal)/layout.tsx para que CUALQUIER página renderee el chrome
 * logueado (sidebar + header) si el usuario tiene sesión, en vez de
 * mostrar el marketing header.
 *
 * Devuelve `null` si NO hay sesión — el caller decide qué pintar
 * (probablemente MarketingHeader).
 */
import { createClient } from '@/lib/supabase/server'
import { getEffectiveRoles } from '@/lib/auth/roles'
import { isEnterpriseUser } from '@/lib/permissions'

export interface ShellContext {
  userId: string
  // Tipo alineado con DashboardShellProps.user: los strings son no-null
  // (rellenamos con '' si vienen vacíos del DB) para evitar TS errors.
  user: {
    display_name: string
    email: string
    role: string
    avatar_url: string | null
  }
  kennel: { name: string; logo_url: string | null } | null
  plan: string
  planIsFounder: boolean
  isClient: boolean
}

export async function loadShellContext(): Promise<ShellContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, kennelRes, roles] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, email, role, avatar_url, plan, plan_is_founder')
      .eq('id', user.id)
      .single(),
    supabase
      .from('kennels')
      .select('name, logo_url')
      .eq('owner_id', user.id)
      .limit(1),
    getEffectiveRoles(user.id),
  ])

  const profile = profileRes.data as {
    display_name?: string | null
    email?: string | null
    role?: string | null
    avatar_url?: string | null
    plan?: string
    plan_is_founder?: boolean
  } | null

  const kennel = kennelRes.data?.[0] || null
  const rawPlan = profile?.plan || 'free'
  const plan = isEnterpriseUser(user.id) ? 'kennel_pro' : rawPlan
  const planIsFounder = isEnterpriseUser(user.id) || Boolean(profile?.plan_is_founder)

  return {
    userId: user.id,
    user: {
      display_name: profile?.display_name ?? '',
      email: profile?.email ?? user.email ?? '',
      role: profile?.role ?? '',
      avatar_url: profile?.avatar_url ?? null,
    },
    kennel,
    plan,
    planIsFounder,
    isClient: roles.isClient,
  }
}
