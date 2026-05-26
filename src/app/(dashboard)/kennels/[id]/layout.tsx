/**
 * Layout de /kennels/[id] — decide chrome Pro vs básico.
 *
 * Comportamiento:
 *  - Si el dueño del kennel es Kennel Pro (o enterprise = Irema), monta el
 *    KennelChrome "compact" encima del contenido (tira con logo + menú de
 *    páginas del kennel). El marketing-header de Genealogic o el sidebar
 *    (según logueado o no) siguen apareciendo arriba — son del layout
 *    superior (dashboard).
 *  - Si no es Pro: pasa-through, sin chrome del kennel. El visitante ve el
 *    perfil básico con el marketing-header normal de Genealogic.
 *
 * Resuelve el menú del chrome aquí (queries en server) para que la nav del
 * kennel aparezca igual en cualquier página de su web Pro. Solo incluye
 * páginas que están enabled Y tienen contenido publicable (regla pedida).
 */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { isUUID } from '@/lib/slug'
import KennelChrome from '@/components/kennel/kennel-chrome'
import {
  isKennelOnProPlan,
  isExtraPageEnabled,
  hasPublishableContent,
  PAGE_NAV_LABEL,
  type ExtraPageId,
} from '@/lib/kennel/pro-web'

export default async function KennelLayout({
  children, params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'

  // Cargamos el kennel + el plan del dueño para decidir Pro vs no
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, name, logo_url, owner_id, enabled_pages, about_md')
    .eq(field, id)
    .single()

  if (!kennel) return notFound()

  // Plan del dueño — solo si hay owner
  let ownerPlan: string | null = null
  if (kennel.owner_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', kennel.owner_id)
      .single()
    ownerPlan = profile?.plan || null
  }

  const isPro = isKennelOnProPlan({ ownerPlan, ownerUserId: kennel.owner_id })

  // Si NO es Pro: sin chrome del kennel — sólo el contenido
  if (!isPro) {
    return <>{children}</>
  }

  // ─── Es Pro: monta tira "compact" con menú ───────────────────────────
  // Contamos contenido para cada página extra para decidir si entra al menú
  const [photosCountRes, postsCountRes] = await Promise.all([
    supabase
      .from('kennel_photos')
      .select('kind', { count: 'exact', head: false })
      .eq('kennel_id', kennel.id),
    supabase
      .from('kennel_posts')
      .select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id)
      .eq('status', 'published'),
  ])

  const photos = (photosCountRes.data || []) as Array<{ kind: string }>
  const galleryCount = photos.filter(p => p.kind === 'gallery').length
  const facilitiesCount = photos.filter(p => p.kind === 'facilities').length
  const publishedPostsCount = postsCountRes.count || 0

  // Construir menú público: páginas base (siempre) + extras enabled+content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enabled = kennel.enabled_pages as Record<string, unknown> | null
  const navItems: Array<{
    id: 'home' | 'perros' | ExtraPageId | 'contacto'
    href: string
    label: string
  }> = [
    { id: 'home',    href: '',           label: PAGE_NAV_LABEL.home },
    { id: 'perros',  href: 'perros',     label: PAGE_NAV_LABEL.perros },
  ]

  const extras: ExtraPageId[] = ['sobre', 'instalaciones', 'galeria', 'blog']
  for (const ex of extras) {
    if (!isExtraPageEnabled(enabled, ex)) continue
    const canPublish = hasPublishableContent({
      page: ex,
      aboutMd: kennel.about_md,
      galleryCount,
      facilitiesCount,
      publishedPostsCount,
    })
    if (!canPublish) continue
    navItems.push({ id: ex, href: ex, label: PAGE_NAV_LABEL[ex] })
  }

  navItems.push({ id: 'contacto', href: 'contacto', label: PAGE_NAV_LABEL.contacto })

  // No podemos detectar la página activa aquí (no tenemos el pathname del
  // layout server). KennelChrome puede recibir activePageId desde cada page,
  // pero para simplicidad lo dejamos en 'home' por defecto — el styling de
  // active no es crítico en compact (es tira pequeña). Para un highlight
  // exacto haríamos un client component que lee usePathname.
  return (
    <>
      <KennelChrome
        kennelName={kennel.name}
        kennelSlug={kennel.slug || kennel.id}
        logoUrl={kennel.logo_url}
        navItems={navItems}
        activePageId="home"
        variant="compact"
      />
      {/* Espacio entre el chrome del kennel y el hero/contenido para que la
          web no se pegue al menú. Mantiene el rítmo vertical del dashboard. */}
      <div className="pt-6 sm:pt-8">
        {children}
      </div>
    </>
  )
}
