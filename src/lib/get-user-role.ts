import { createClient } from '@/lib/supabase/server'
import type { UserPlan } from '@/lib/permissions'

/**
 * Server-side helper to get the current user's role + plan.
 * Returns sensible defaults if not authenticated or no profile.
 */
export async function getUserRole(): Promise<{
  userId: string | null
  role: string
  plan: UserPlan
  planIsFounder: boolean
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { userId: null, role: 'owner', plan: 'free', planIsFounder: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan, plan_is_founder')
    .eq('id', user.id)
    .single()

  return {
    userId: user.id,
    role: profile?.role || 'owner',
    plan: (profile?.plan as UserPlan) || 'free',
    planIsFounder: Boolean(profile?.plan_is_founder),
  }
}
