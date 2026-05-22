import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/dashboard-shell'
import PublicHeader from '@/components/layout/public-header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // For unauthenticated users (public pages like dog detail, kennel profile)
  if (!user) {
    return (
      <div className="min-h-screen bg-canvas text-[var(--foreground)]">
        <PublicHeader />
        <main className="px-4 sm:px-[30px] py-4 sm:py-6 max-w-7xl mx-auto">{children}</main>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, role, avatar_url, plan, plan_is_founder')
    .eq('id', user.id)
    .single()

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('name, logo_url')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0] || null

  const plan = (profile as any)?.plan || 'free'
  const planIsFounder = Boolean((profile as any)?.plan_is_founder)

  return (
    <DashboardShell
      user={profile}
      kennel={kennel}
      plan={plan}
      planIsFounder={planIsFounder}
      userId={user.id}
    >
      {children}
    </DashboardShell>
  )
}
