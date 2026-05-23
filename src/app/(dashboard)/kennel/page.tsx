import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KennelConfigView from '@/components/kennel/kennel-config-view'

export const dynamic = 'force-dynamic'

/**
 * "Mi criadero" → CONFIGURACIÓN del criadero + KPIs + atajos.
 * NO lista perros aquí (eso vive en /dogs con tabs). Antes este page
 * duplicaba la lista de dogs, lo que generaba confusión sobre "¿dónde
 * añado un perro?". El refactor IA (FASE 1 paso 5) lo limpia.
 */
export default async function KennelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: kennels } = await supabase
    .from('kennels')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
  const kennel = kennels?.[0] || null

  if (!kennel) {
    redirect('/kennel/new')
  }

  // Solo COUNTS — no se cargan listas. Las listas viven en /dogs y /litters.
  const [dogsCountRes, visibleCountRes, reproductiveCountRes, littersCountRes] = await Promise.all([
    supabase.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id),
    supabase.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).neq('show_in_kennel', false),
    supabase.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).eq('is_reproductive', true),
    supabase.from('litters').select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id),
  ])

  return (
    <KennelConfigView
      kennel={kennel}
      stats={{
        dogs: dogsCountRes.count || 0,
        visible: visibleCountRes.count || 0,
        reproductive: reproductiveCountRes.count || 0,
        litters: littersCountRes.count || 0,
      }}
      userId={user.id}
    />
  )
}
