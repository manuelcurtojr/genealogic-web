import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KennelConfigView from '@/components/kennel/kennel-config-view'
import PagesToggles from '@/components/kennel/pages-toggles'
import { hasProAccess, isKennelPro, isEnterpriseUser, normalizePlan } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

/**
 * "Mi criadero" → CONFIGURACIÓN + KPIs + toggles de páginas de la web Pro.
 *
 * Las páginas Pro (Sobre, Galería, Instalaciones, Blog) se gestionan aquí.
 * El editor de CONTENIDO (about_md, fotos, posts) vendrá en una iteración
 * próxima — por ahora solo el toggle de visibilidad.
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
    customPageRes,
    profileRes,
    galleryRes,
    facilitiesRes,
    postsRes,
  ] = await Promise.all([
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
    supabase.from('kennel_photos').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).eq('kind', 'gallery'),
    supabase.from('kennel_photos').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).eq('kind', 'facilities'),
    supabase.from('kennel_posts').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).eq('status', 'published'),
  ])

  const hasCustomWeb = !!customPageRes.data && !!kennel.slug
  const isPro = hasProAccess(profileRes.data?.plan)
  // Para los toggles de páginas Pro: enterprise users + kennel_pro plan
  const canUsePro = isEnterpriseUser(user.id) || isKennelPro(normalizePlan(profileRes.data?.plan))

  // Status del contenido para los badges "Pendiente: contenido" en toggles
  const contentStatus = {
    aboutOk: !!(kennel.about_md && kennel.about_md.trim().length >= 50),
    galleryOk: (galleryRes.count || 0) >= 3,
    facilitiesOk: (facilitiesRes.count || 0) >= 3,
    blogOk: (postsRes.count || 0) >= 1,
  }

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
      <PagesToggles
        kennelId={kennel.id}
        enabledPages={kennel.enabled_pages || null}
        canUsePro={canUsePro}
        contentStatus={contentStatus}
      />
    </div>
  )
}
