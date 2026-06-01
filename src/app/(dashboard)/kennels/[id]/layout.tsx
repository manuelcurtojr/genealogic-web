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
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { isUUID } from '@/lib/slug'
import { isDynamicSiteHost } from '@/lib/kennel/custom-site'
import KennelChrome from '@/components/kennel/kennel-chrome'
import KennelProFooter from '@/components/kennel/kennel-pro-footer'
import {
  isKennelOnProPlan,
  isExtraPageEnabled,
  hasPublishableContent,
  PAGE_NAV_LABEL,
  type ExtraPageId,
} from '@/lib/kennel/pro-web'
import { getKennelReproductiveBreeds } from '@/lib/kennel/breeds'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export default async function KennelLayout({
  children, params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'

  // Cargamos el kennel + el plan del dueño para decidir Pro vs no
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, name, logo_url, owner_id, enabled_pages, about_md, city, country, website, social_instagram, social_facebook')
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

  // ¿Hay sidebar? Solo logueado el perfil se monta dentro del DashboardShell
  // (sidebar a la izquierda). Sin login va en el layout público (centrado).
  const { data: { user } } = await supabase.auth.getUser()
  const loggedIn = !!user

  // ¿Servido bajo el dominio propio del criadero (web dinámica)? Entonces
  // este layout es el ÚNICO chrome: header standalone + footer propios, sin
  // nada de Genealogic alrededor (el (dashboard)/layout.tsx ya devolvió bare
  // children para este host). Links del nav en formato corto (/perros).
  const standalone = isDynamicSiteHost((await headers()).get('host'))

  // Stage = contenedor del perfil del criadero. Objetivo: que logueado se vea
  // EXACTO que en público (contenido en max-w-7xl centrado + fondos a ancho
  // completo), pero anclado a la COLUMNA en vez de al viewport.
  //
  // Logueado (dentro del DashboardShell, con sidebar):
  //   · -mx-4 lg:-mx-[46px] cancela el padding del shell (main p-4 = 16px + el
  //     div interior lg:px-[30px]) → el Stage llena la columna, del borde del
  //     sidebar al borde derecho. El ancho del sidebar vive en `ml` del shell,
  //     así que al colapsar el menú la columna se reajusta sola.
  //   · El div interior max-w-7xl mx-auto px-4 sm:px-[30px] centra el contenido
  //     NO-bleed con el MISMO inset que el <main> público.
  //   · Las secciones full-bleed usan .kennel-bleed (globals.css): restan
  //     --sidebar-width y llenan la columna EXACTA → fondos a ancho completo y
  //     cero scroll. overflow-x-clip queda de red de seguridad anti-redondeo
  //     (clip, no hidden, para no romper los position:sticky internos).
  //
  // No logueado: passthrough — el <main> público ya da max-w-7xl + centrado y
  // .kennel-bleed cae a 100vw del viewport (no hay --sidebar-width). NO se toca.
  const Stage = ({ children }: { children: React.ReactNode }) =>
    loggedIn
      ? (
        <div className="-mx-4 lg:-mx-[46px] overflow-x-clip">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-[30px]">{children}</div>
        </div>
      )
      : <>{children}</>

  // Si NO es Pro: sin chrome del kennel — sólo el contenido
  if (!isPro) {
    // Bajo dominio propio: contenido centrado en max-w-7xl, sin chrome.
    if (standalone) {
      return (
        <div className="min-h-screen bg-canvas text-ink flex flex-col">
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-[30px] py-4 sm:py-6">
            {children}
          </main>
        </div>
      )
    }
    return <Stage>{children}</Stage>
  }

  // ─── Es Pro: monta tira "compact" con menú ───────────────────────────
  // Contamos contenido para cada página extra para decidir si entra al menú
  const [photosCountRes, postsCountRes, breedsForNav] = await Promise.all([
    supabase
      .from('kennel_photos')
      .select('kind', { count: 'exact', head: false })
      .eq('kennel_id', kennel.id),
    supabase
      .from('kennel_posts')
      .select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id)
      .eq('status', 'published'),
    // Razas con contenido promocional que el kennel cría — para decidir si
    // entra "Nuestra(s) raza(s)" al menú. Si la lista está vacía, no aparece.
    getKennelReproductiveBreeds(kennel.id),
  ])

  const photos = (photosCountRes.data || []) as Array<{ kind: string }>
  const galleryCount = photos.filter(p => p.kind === 'gallery').length
  const facilitiesCount = photos.filter(p => p.kind === 'facilities').length
  const publishedPostsCount = postsCountRes.count || 0

  // Construir menú público: páginas base (siempre) + extras enabled+content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enabled = kennel.enabled_pages as Record<string, unknown> | null
  const navItems: Array<{
    id: 'home' | 'perros' | ExtraPageId | 'contacto' | 'razas'
    href: string
    label: string
  }> = [
    { id: 'home',    href: '',           label: PAGE_NAV_LABEL.home },
    { id: 'perros',  href: 'perros',     label: PAGE_NAV_LABEL.perros },
  ]

  // "Nuestra raza" / "Nuestras razas" — solo si el kennel tiene reproductores
  // públicos en razas con promotional_content. Sin esfuerzo del criador.
  if (breedsForNav.length > 0) {
    navItems.push({
      id: 'razas',
      href: 'razas',
      label: breedsForNav.length === 1 ? t('Nuestra raza') : t('Nuestras razas'),
    })
  }

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
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')

  // ─── Web propia (dominio del criadero): chrome standalone ─────────────
  // Header completo (no la tira compact), contenido en max-w-7xl centrado
  // (los fondos full-bleed rompen a 100vw, igual que en la vista pública),
  // footer propio, y nav con URLs cortas (/perros). Cero chrome de Genealogic.
  if (standalone) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col">
        <KennelChrome
          kennelName={kennel.name}
          kennelSlug={kennel.slug || kennel.id}
          logoUrl={kennel.logo_url}
          navItems={navItems}
          activePageId="home"
          variant="standalone"
          shortHrefs
        />
        {/* Sin padding-top: el contenido (en la home, el hero full-bleed)
            queda pegado al header. El aire inferior se mantiene. */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-[30px] pb-8 sm:pb-12">
          {children}
        </main>
        <KennelProFooter
          kennelId={kennel.id}
          kennelName={kennel.name}
          kennelSlug={kennel.slug || kennel.id}
          kennelLogoUrl={kennel.logo_url}
          location={location}
          socials={{
            website: kennel.website,
            instagram: kennel.social_instagram,
            facebook: kennel.social_facebook,
          }}
          shortHrefs
        />
      </div>
    )
  }

  // TODO el perfil (chrome + contenido + footer) va dentro de UN solo Stage:
  // logueado, llena la columna y recorta los 100vw a sus bordes (fondos a ancho
  // completo, sin scroll); no logueado, passthrough (lo centra el layout público).
  return (
    <Stage>
      <KennelChrome
        kennelName={kennel.name}
        kennelSlug={kennel.slug || kennel.id}
        logoUrl={kennel.logo_url}
        navItems={navItems}
        activePageId="home"
        variant="compact"
      />
      {children}

      {/* Footer Pro fusionado (identidad + newsletter), full-bleed.
          Aparece en TODAS las subpáginas del kennel Pro — antes vivía
          solo dentro de pro-home y se perdía al navegar a /razas, /sobre,
          /perros, etc. */}
      <KennelProFooter
        kennelId={kennel.id}
        kennelName={kennel.name}
        kennelSlug={kennel.slug || kennel.id}
        kennelLogoUrl={kennel.logo_url}
        location={location}
        socials={{
          website: kennel.website,
          instagram: kennel.social_instagram,
          facebook: kennel.social_facebook,
        }}
      />
    </Stage>
  )
}
