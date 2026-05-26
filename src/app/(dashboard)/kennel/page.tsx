import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KennelConfigView from '@/components/kennel/kennel-config-view'
import SectionsToggles from '@/components/kennel/sections-toggles'
import { hasProAccess, isKennelPro, isEnterpriseUser, normalizePlan } from '@/lib/permissions'

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
    .select('*, contact_form_config')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
  const kennel = kennels?.[0] || null

  if (!kennel) {
    redirect('/kennel/new')
  }

  // Solo COUNTS + flags para el toggle de vista pública.
  const [dogsCountRes, visibleCountRes, reproductiveCountRes, littersCountRes, customPageRes, profileRes] = await Promise.all([
    supabase.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id),
    supabase.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).neq('show_in_kennel', false),
    supabase.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).eq('is_reproductive', true),
    supabase.from('litters').select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id),
    supabase.from('kennel_pages')
      .select('id')
      .eq('kennel_id', kennel.id).eq('slug', 'home').eq('enabled', true)
      .maybeSingle(),
    supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
  ])

  const hasCustomWeb = !!customPageRes.data && !!kennel.slug
  const isPro = hasProAccess(profileRes.data?.plan)
  // Para los toggles de secciones Pro: enterprise users + kennel_pro plan.
  const canUsePro = isEnterpriseUser(user.id) || isKennelPro(normalizePlan(profileRes.data?.plan))

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
        hasCustomWeb={hasCustomWeb}
        isPro={isPro}
        userId={user.id}
      />
      <SectionsToggles
        kennelId={kennel.id}
        enabledSections={kennel.enabled_sections || null}
        canUsePro={canUsePro}
      />
    </div>
  )
}
