/**
 * Gate del Simulador de cruces (/cruces) — feature de Kennel Pro (49€).
 *
 * La página (PlannerPage) es un client component y solo comprobaba `!user`,
 * así que cualquiera con sesión podía abrirla por URL aunque el sidebar la
 * oculte (el flag requiresPro del nav era solo cosmético). Este layout añade
 * el gate REAL server-side: si el plan no tiene features Pro → /pricing.
 *
 * Mismo patrón que /web/layout.tsx (gate Enterprise) y
 * /kennel/contenido/layout.tsx (gate Pro con redirect).
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasProFeatures, isEnterpriseUser, normalizePlan } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function CrucesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  if (!isEnterpriseUser(user.id) && !hasProFeatures(normalizePlan(profile?.plan))) {
    redirect('/pricing')
  }

  return <>{children}</>
}
