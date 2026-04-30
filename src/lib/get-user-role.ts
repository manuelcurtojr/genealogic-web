import { createClient } from '@/lib/supabase/server'

/**
 * Server-side helper to get the current user's role.
 * Returns 'owner' if not authenticated or no profile.
 */
export async function getUserRole(): Promise<{ userId: string | null; role: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { userId: null, role: 'owner' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { userId: user.id, role: profile?.role || 'owner' }
}
