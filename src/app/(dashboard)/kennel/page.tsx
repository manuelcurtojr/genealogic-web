import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KennelConfigView from '@/components/kennel/kennel-config-view'
import { hasProAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

/**
 * "Mi criadero" → CONFIGURACIÓN + KPIs.
 */
export default async function KennelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: kennels } = await supabase
    .from('kennels')
    .select('*, contact_form_config')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
  const kennel = kennels?.[0] || null

  if (!kennel) {
    redirect('/kennel/new')
  }

  // Counts (KPIs) + status del contenido para mostrar badges en los toggles
  const [
    dogsCountRes,
    visibleCountRes,
    reproductiveCountRes,
    littersCountRes,
    profileRes,
  ] = await Promise.all([
    supabase.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id),
    supabase.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).neq('show_in_kennel', false),
    supabase.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).eq('is_reproductive', true),
    supabase.from('litters').select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id),
    supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
  ])

  const isPro = hasProAccess(profileRes.data?.plan)

  return (
    <div className="space-y-6">
      <KennelConfigView
        kennel={kennel}
        stats={{
          dogs: dogsCountRes.count || 0,
          visible: visibleCountRes.count || 0,
          reproductive: reproductiveCountRes.count || 0,
          litters: littersCountRes.count || 0,
        }}
        isPro={isPro}
        userId={user.id}
      />
    </div>
  )
}
