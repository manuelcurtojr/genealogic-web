/**
 * Helper compartido para las páginas secundarias de la web Pro
 * (/kennels/[slug]/sobre, /instalaciones, /galeria, /blog, /perros, /contacto).
 *
 * Cada página secundaria:
 *  1) Resuelve el kennel por slug/id
 *  2) Comprueba que el dueño es Kennel Pro (o enterprise) — si no, redirect
 *     a la home del kennel (para no romper URLs si alguien comparte un link
 *     de una página Pro de un kennel que se cambió a Kennel)
 *  3) Comprueba que la página está enabled Y tiene contenido — si no:
 *     - Si es el owner: render anyway con banner "Esta página no es pública
 *       hasta que añadas contenido"
 *     - Si NO es el owner: notFound (404)
 *
 * Devuelve el kennel + flags listos para que el page haga sus queries
 * adicionales (perros para /perros, fotos para /galeria, etc).
 */
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { isUUID } from '@/lib/slug'
import {
  isKennelOnProPlan,
  isExtraPageEnabled,
  hasPublishableContent,
  type ExtraPageId,
} from './pro-web'

export type ProPageLoadResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kennel: any
  /** True si el visitante actual es el dueño del kennel. */
  isOwner: boolean
  /** True si la página tiene contenido publicable. Si false e isOwner=false → 404. */
  hasContent: boolean
}

/**
 * Carga el kennel y aplica todos los gates necesarios para una página Pro.
 * @param kennelId  slug o uuid del kennel desde params
 * @param pageId    'sobre' | 'instalaciones' | 'galeria' | 'blog' (null para
 *                  páginas base — perros, contacto — que solo gate Pro)
 * @param contentChecker  función async para calcular si la página tiene
 *                        contenido. Solo se llama cuando es necesario.
 */
export async function loadProPage(args: {
  kennelId: string
  /** Si la página es base (perros, contacto) pasar null — no chequea content. */
  pageId: ExtraPageId | null
  contentChecker?: () => Promise<{
    aboutMd?: string | null
    galleryCount?: number
    facilitiesCount?: number
    publishedPostsCount?: number
  }>
}): Promise<ProPageLoadResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(args.kennelId) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('*')
    .eq(field, args.kennelId)
    .single()
  if (!kennel) notFound()

  // Slug canonical
  if (field === 'id' && kennel.slug && kennel.slug !== args.kennelId) {
    redirect(`/kennels/${kennel.slug}/${args.pageId ?? ''}`.replace(/\/$/, ''))
  }

  const isOwner = user?.id === kennel.owner_id

  // Plan del dueño
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

  // Si NO es Pro: las páginas secundarias no existen — redirect a la home
  if (!isPro) {
    redirect(`/kennels/${kennel.slug || kennel.id}`)
  }

  // Gate de página extra: enabled + content
  let hasContent = true
  if (args.pageId) {
    const enabled = isExtraPageEnabled(kennel.enabled_pages as Record<string, unknown> | null, args.pageId)
    if (!enabled) {
      // Disabled completamente: visitante no logueado o no-owner → 404.
      if (!isOwner) notFound()
      // Owner: lo dejamos pasar pero hasContent=false para que vea banner
      hasContent = false
    } else if (args.contentChecker) {
      const checks = await args.contentChecker()
      hasContent = hasPublishableContent({ page: args.pageId, ...checks })
      if (!hasContent && !isOwner) notFound()
    }
  }

  return { kennel, isOwner, hasContent }
}

/**
 * Banner que se muestra al owner cuando una página secundaria está activada
 * pero no tiene contenido publicable. Mensaje guía: "esto no se ve aún hasta
 * que añadas X".
 */
export function pageNotYetPublicMessage(page: ExtraPageId): string {
  switch (page) {
    case 'sobre':         return 'Esta página solo se mostrará pública cuando añadas al menos 50 caracteres en "Sobre nosotros".'
    case 'galeria':       return 'Esta página solo se mostrará pública cuando subas al menos 3 fotos a la galería.'
    case 'instalaciones': return 'Esta página solo se mostrará pública cuando subas al menos 3 fotos de las instalaciones.'
    case 'blog':          return 'Esta página solo se mostrará pública cuando publiques al menos 1 post.'
    default:              return 'Esta página no se mostrará pública hasta que añadas contenido.'
  }
}
