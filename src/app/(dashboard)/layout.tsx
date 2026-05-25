import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/dashboard-shell'
import MarketingHeader from '@/components/marketing/marketing-header'
import MarketingFooter from '@/components/marketing/marketing-footer'
import { getEffectiveRoles } from '@/lib/auth/roles'
import { isEnterpriseUser } from '@/lib/permissions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Visitantes no logueados (perfil público de perro/criadero, /search, /kennels)
  // ven el mismo marketing header + footer que la home, para que la navegación
  // entre páginas públicas sea consistente y puedan llegar a registrarse.
  if (!user) {
    return (
      <div className="min-h-screen bg-canvas text-[var(--foreground)] flex flex-col">
        <MarketingHeader />
        <main className="flex-1 px-4 sm:px-[30px] py-4 sm:py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <MarketingFooter />
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

  // Enterprise/founder override: usuarios con cuenta "comp" siempre ven
  // kennel_pro independientemente del plan que tengan en DB. Esto cubre
  // bugs de propagación de plan, migrations en vuelo, y al fundador.
  const rawPlan = (profile as any)?.plan || 'free'
  const plan = isEnterpriseUser(user.id) ? 'kennel_pro' : rawPlan
  const planIsFounder = isEnterpriseUser(user.id) || Boolean((profile as any)?.plan_is_founder)

  // Detecta roles efectivos del user (isClient = tiene reservas o perros transferidos).
  // Si es client, el sidebar muestra el bloque "Propietario" con Mis reservas/perros.
  const roles = await getEffectiveRoles(user.id)

  return (
    <DashboardShell
      user={profile}
      kennel={kennel}
      plan={plan}
      planIsFounder={planIsFounder}
      userId={user.id}
      isClient={roles.isClient}
    >
      {children}
    </DashboardShell>
  )
}
