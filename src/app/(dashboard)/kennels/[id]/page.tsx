import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Img } from '@/components/ui/img'
import { ArrowLeft, Globe, Calendar, MapPin, ExternalLink, Sparkles, BadgeCheck } from 'lucide-react'
import { isUUID } from '@/lib/slug'
import { pastelByName } from '@/lib/avatars'
import KennelPublicTabs from '@/components/kennel/kennel-public-tabs'
import PageTracker from '@/components/track/page-tracker'
import RecordView from '@/components/track/record-view'
import ContactKennelButton from '@/components/kennel/contact-kennel-button'
import ClaimBanner from '@/components/admin-requests/claim-banner'
import JoinBanner from '@/components/marketing/join-banner'
import ReportButton from '@/components/legal/report-dialog'
import ModerateButton from '@/components/moderation/moderate-button'
import { HIDDEN_REASON_LABELS, type HiddenReason } from '@/lib/moderation/types'
import { EyeOff } from 'lucide-react'
import { sortDogsByPhotoQuality } from '@/lib/dogs/sort-quality'
import { KennelJsonLd, BreadcrumbJsonLd } from '@/lib/seo/json-ld'
import { getKennelReproductiveBreedNames } from '@/lib/kennel/breeds'
import { getKennelHomeData } from '@/lib/kennel/kennel-home-cache'
import type { Metadata } from 'next'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

/**
 * Home pública del criadero.
 *
 * Perfil simple (hero rediseñado + tabs de perros + contacto).
 */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('name, slug, logo_url, description, country, city')
    .eq(field, id)
    .single()
  if (!kennel) return { title: 'Criadero no encontrado — Genealogic' }

  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const description = kennel.description?.substring(0, 160)
    || `Criadero ${kennel.name}${location ? ' en ' + location : ''} | Genealogic`
  const image = kennel.logo_url || 'https://www.genealogic.io/icon.svg'
  const canonical = `https://www.genealogic.io/kennels/${kennel.slug || id}`

  return {
    title: `${kennel.name} — Criadero | Genealogic`,
    description,
    alternates: { canonical },
    openGraph: {
      title: kennel.name,
      description,
      url: canonical,
      images: [{ url: image, alt: kennel.name }],
      type: 'website',
      siteName: 'Genealogic',
    },
    twitter: { card: 'summary_large_image', title: kennel.name, description, images: [image] },
  }
}

export default async function KennelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase.from('kennels').select('*').eq(field, id).single()
  if (!kennel) notFound()

  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}`)
  }

  // ── Soft-hide gating ─────────────────────────────────────────────────
  // Si el criadero está oculto:
  //  · Admin → ve la página con banner rojo + botón restaurar
  //  · Owner → ve la página (puede apelar)
  //  · Resto → 404
  let userIsAdmin = false
  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userIsAdmin = prof?.role === 'admin'
  }
  const isOwnerOfKennel = !!(user && kennel.owner_id && user.id === kennel.owner_id)
  const isHidden = !!kennel.hidden_at
  if (isHidden && !userIsAdmin && !isOwnerOfKennel) {
    notFound()
  }

  // Nota: anteriormente había un redirect a /c/[slug] cuando el kennel tenía
  // `default_public_view='custom_web'`. Ya no aplica — los criaderos Pro
  // tienen directamente su web vitaminada en /kennels/[slug] (chrome + páginas).
  // /c/[slug] sigue accesible para quien lo enlace directamente, pero NO es
  // la vista por defecto para nadie.
  const isOwner = user?.id === kennel.owner_id

  // ─── Datos comunes (cacheados 120s vía unstable_cache) ─────────────
  // Todas las queries pesadas de la home viven en getKennelHomeData,
  // que se cachea por kennel.id durante 120s. Visitas repetidas (común
  // en una web pública) golpean el caché, no la BD. La auth (getUser
  // arriba) se mantiene dinámica fuera del caché.
  const homeData = await getKennelHomeData(
    kennel.id,
    kennel.owner_id || null,
    (kennel.breed_ids as string[] | null) || null,
  )
  const allDogs = homeData.allDogs
  const allLitters = homeData.allLitters
  const breedNames = homeData.breedNames
  // Razas de los reproductores para el selector del formulario de contacto
  // (si hay >=2, el criador sabrá por qué raza preguntan los leads).
  const reproBreedNames = await getKennelReproductiveBreedNames(supabase, kennel.id)


  // Sort 3-tier (count fotos): perros con galería rica primero, después
  // los que solo tienen thumbnail, al final los sin foto. El photoCount
  // ya viene cacheado dentro de getKennelHomeData — sin penalización en
  // visitas repetidas.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dogs = sortDogsByPhotoQuality(allDogs as any[], homeData.photoCount)
  const litters = allLitters
  const forSale = dogs.filter((d: { is_for_sale: boolean | null }) => d.is_for_sale)
  // Reproductor DE ESTE criadero = lo POSEE (owner_id), o lo crió y nadie lo posee.
  // `is_reproductive` es un flag GLOBAL del perro (lo marca su dueño actual), así
  // que un macho criado aquí pero vendido a otro criadero (que lo usa de semental)
  // NO es nuestro reproductor: para nosotros es "producido por". Caso real: Sirio
  // de l'Argenteria sale como reproductor en El Nieto (lo posee) y como producido
  // en L'argenteria (lo crió, ya no lo posee).
  const ownerId = kennel.owner_id || null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isReproOfThisKennel = (d: any) =>
    !!d.is_reproductive && !d.is_for_sale && (d.owner_id === ownerId || (d.owner_id == null && d.kennel_id === kennel.id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reproductores = dogs.filter((d: any) => isReproOfThisKennel(d))
  // "Producidos/Criados por el criadero" = el resto de su catálogo no en venta
  // (incluye los que crió y vendió, aunque otro criadero los use de reproductor).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const criados = dogs.filter((d: any) => !d.is_for_sale && !isReproOfThisKennel(d))

  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$', COP: '$', ARS: '$', CLP: '$' }
  const canonicalUrl = `https://www.genealogic.io/kennels/${kennel.slug || id}`
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const foundationYear = kennel.foundation_date ? new Date(kennel.foundation_date).getFullYear() : null

  // Stats enriquecidos: cada uno con icono, label y sublabel opcional.
  // El primero (yearsActive) es el highlight — sale grande arriba en la
  // card. Los demás van en el grid debajo. Cada stat se filtra si no
  // tiene contenido significativo.
  const yearsActive = foundationYear ? new Date().getFullYear() - foundationYear : 0
  const completedLittersCount = litters.filter((l: { status: string }) => l.status === 'born' || l.status === 'delivered').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const puppiesCount = litters.reduce((sum: number, l: any) => sum + (l.puppy_count || 0), 0)

  type StatItem = {
    icon: 'calendar' | 'dog' | 'baby' | 'sparkles' | 'medal'
    value: string
    label: string
    sublabel?: string
    highlight?: boolean
  }
  const stats: StatItem[] = []
  if (yearsActive >= 1) {
    stats.push({
      icon: 'calendar',
      value: yearsActive >= 50 ? `${yearsActive}+` : String(yearsActive),
      label: yearsActive === 1 ? t('año') : t('años'),
      sublabel: `${t('Desde')} ${foundationYear}`,
      highlight: true,
    })
  }
  if (dogs.length > 0) {
    stats.push({
      icon: 'dog',
      value: dogs.length.toLocaleString('es-ES'),
      label: dogs.length === 1 ? t('Perro') : t('Perros'),
      sublabel: t('En la familia'),
    })
  }
  if (completedLittersCount > 0) {
    stats.push({
      icon: 'baby',
      value: completedLittersCount.toLocaleString('es-ES'),
      label: completedLittersCount === 1 ? t('Camada') : t('Camadas'),
      sublabel: puppiesCount > 0 ? `${puppiesCount.toLocaleString('es-ES')} ${t('cachorros')}` : undefined,
    })
  }
  if (breedNames.length > 0) {
    stats.push({
      icon: 'medal',
      value: breedNames.length === 1 ? breedNames[0] : String(breedNames.length),
      label: breedNames.length === 1 ? t('Raza') : t('Razas'),
      sublabel: breedNames.length === 1 ? t('Especialidad') : undefined,
    })
  }

  // Tagline del hero del perfil básico — corta en límite de palabra
  // (sin '…') hasta ~280 chars, o devuelve completo si es corto.
  const tagline = kennel.description ? truncateAtWord(kennel.description, 280) : null
  const hasOwner = !!kennel.owner_id

  // ─── JSON-LD + tracking común ───────────────────────────────────────
  const seo = (
    <>
      <KennelJsonLd
        name={kennel.name}
        url={canonicalUrl}
        description={kennel.description}
        logoUrl={kennel.logo_url}
        city={kennel.city}
        country={kennel.country}
        foundationDate={kennel.foundation_date}
        website={kennel.website}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: 'https://www.genealogic.io' },
          { name: 'Criaderos', url: 'https://www.genealogic.io/kennels' },
          { name: kennel.name, url: canonicalUrl },
        ]}
      />
      <PageTracker kennelId={kennel.id} />
      <RecordView type="kennel" itemRef={kennel.slug || kennel.id} name={kennel.name} image={kennel.logo_url} subtitle={[kennel.city, kennel.country].filter(Boolean).join(', ') || null} />

      {/* Banner moderación admin si el criadero está oculto */}
      {isHidden && userIsAdmin && kennel.hidden_reason && (
        <ModerateButton
          targetType="kennel"
          targetId={kennel.id}
          targetLabel={kennel.name}
          hidden={{
            reason: kennel.hidden_reason as HiddenReason,
            notes: kennel.hidden_notes || null,
            at: kennel.hidden_at,
          }}
          reportId={kennel.hidden_report_id || null}
          variant="banner"
        />
      )}

      {/* Aviso al owner cuando su criadero está oculto */}
      {isHidden && !userIsAdmin && isOwnerOfKennel && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 flex items-start gap-3">
          <EyeOff className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900">
              {t('Este criadero está oculto al público')}
            </p>
            <p className="text-[12px] text-red-800 mt-1">
              {t('Motivo:')} <strong>{kennel.hidden_reason && HIDDEN_REASON_LABELS[kennel.hidden_reason as HiddenReason]}</strong>.
              {' '}{t('Para apelar o aportar pruebas, contacta con')}{' '}
              <a href="mailto:hola@genealogic.io?subject=Apelaci%C3%B3n%20criadero%20oculto" className="font-medium underline">
                hola@genealogic.io
              </a>.
            </p>
          </div>
        </div>
      )}

      {!kennel.owner_id && !isHidden && (
        <ClaimBanner type="kennel" targetId={kennel.slug || kennel.id} targetName={kennel.name} />
      )}

      {/* Join banner — visitante anónimo en criadero YA reclamado */}
      {!user && kennel.owner_id && !isHidden && <JoinBanner type="kennel" />}
    </>
  )

  // ═══════════════════════════════════════════════════════════════════
  // FREE / KENNEL — perfil básico (1 landing)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-8 sm:space-y-12">
      {seo}

      {/* Back nav */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={isOwner ? '/kennel' : '/kennels'}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> {t('Volver')}
        </Link>
      </div>

      {/* HERO simple */}
      <section className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-orange-50/60 via-canvas to-blue-50/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full blur-3xl opacity-50"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(254,102,32,0.35) 0%, rgba(254,102,32,0.1) 40%, transparent 70%)',
          }}
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 p-6 sm:p-8 lg:p-12">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                {kennel.logo_url ? (
                  <Img w={200} src={kennel.logo_url} alt={kennel.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: pastelByName(kennel.name) }}>
                    <span className="text-3xl sm:text-4xl font-semibold text-white">{kennel.name[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{t('Criadero')}</span>
                  {hasOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      <BadgeCheck className="h-3 w-3" /> {t('Verificado')}
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-[30px] sm:text-[40px] lg:text-[44px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink break-words">
                  {kennel.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
                  {location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {location}</span>}
                  {foundationYear && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {t('Desde')} {foundationYear}</span>}
                </div>
              </div>
            </div>

            {tagline && (
              <p className="text-[15.5px] sm:text-[17px] text-body leading-[1.55] max-w-prose">{tagline}</p>
            )}

            {breedNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {breedNames.slice(0, 5).map(b => (
                  <span key={b} className="inline-flex items-center rounded-full bg-canvas border border-hairline px-2.5 py-1 text-[11.5px] font-medium text-body">
                    {b}
                  </span>
                ))}
                {breedNames.length > 5 && (
                  <span className="inline-flex items-center px-2 py-1 text-[11.5px] text-muted">+{breedNames.length - 5}</span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {hasOwner && (
                <ContactKennelButton kennelId={kennel.id} kennelName={kennel.name} config={kennel.contact_form_config || null} reproBreedNames={reproBreedNames} />
              )}
              <Link
                href="#perros"
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-4 py-2.5 text-[13px] font-bold hover:border-ink/30 transition"
              >
                {t('Ver perros')}
              </Link>
              {kennel.social_instagram && (
                <a href={kennel.social_instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas/70 backdrop-blur-sm text-body px-3 py-2.5 text-[12.5px] font-semibold hover:border-ink/30 hover:text-ink transition">
                  <ExternalLink className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
              {kennel.website && (
                <a href={kennel.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas/70 backdrop-blur-sm text-body px-3 py-2.5 text-[12.5px] font-semibold hover:border-ink/30 hover:text-ink transition">
                  <Globe className="h-3.5 w-3.5" /> {t('Web')}
                </a>
              )}
            </div>
          </div>

          {stats.length > 0 && (
            <aside className="rounded-2xl bg-canvas/80 backdrop-blur-md border border-hairline p-5 sm:p-6 self-start w-full">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#FE6620] mb-3">
                {t('Trayectoria')}
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {stats.slice(0, 3).map((s: any) => {
                  const isLong = String(s.value).length > 6
                  return (
                    <div key={s.label} className="min-w-0">
                      <p className={`${isLong ? 'text-[15px]' : 'text-[24px] sm:text-[28px] tabular-nums'} font-semibold tracking-[-0.03em] text-ink leading-tight truncate`}>
                        {s.value}
                      </p>
                      <p className="mt-1.5 text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted truncate">{s.label}</p>
                      {s.sublabel && (
                        <p className="mt-0.5 text-[10.5px] text-muted/80 truncate">{s.sublabel}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* NUESTROS PERROS */}
      <section id="perros" className="scroll-mt-24">
        <div className="mb-5 sm:mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{t('Catálogo')}</p>
          <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">{t('Nuestros perros')}</h2>
        </div>
        <KennelPublicTabs
          kennelName={kennel.name}
          reproductores={reproductores}
          forSale={forSale}
          litters={litters}
          criados={criados}
          currencySymbol={currencySymbol}
        />
      </section>

      {/* CTA contacto */}
      {hasOwner && (
        <section className="rounded-2xl border border-hairline bg-canvas p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.6fr] gap-5 sm:gap-8 items-center">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{t('Hablemos')}</p>
              <h2 className="mt-1 text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-ink">{t('¿Te interesa una camada o un perro?')}</h2>
              <p className="mt-2 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-prose">{t('Escríbenos por el formulario y te respondemos en breve. Sin compromiso.')}</p>
            </div>
            <div className="flex sm:justify-end">
              <ContactKennelButton kennelId={kennel.id} kennelName={kennel.name} config={kennel.contact_form_config || null} reproBreedNames={reproBreedNames} />
            </div>
          </div>
        </section>
      )}

      {/* Reportar perfil — discreto, al final, fuera del path principal */}
      {user?.id !== kennel.owner_id && (
        <div className="flex justify-center pt-2">
          <ReportButton
            targetType="kennel"
            targetId={kennel.id}
            targetUrl={`/kennels/${kennel.slug || kennel.id}`}
            targetLabel={kennel.name}
            currentUserEmail={user?.email || null}
            trigger="text"
          />
        </div>
      )}
    </div>
  )
}

/** Trunca un texto en el último límite de palabra antes de maxChars, sin
 *  añadir "…". Si es más corto que maxChars devuelve el original. */
function truncateAtWord(text: string, maxChars: number): string {
  const t = text.trim()
  if (t.length <= maxChars) return t
  const slice = t.slice(0, maxChars)
  const lastBreak = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('\n'))
  if (lastBreak < maxChars * 0.6) return slice.trimEnd()
  return slice.slice(0, lastBreak).trimEnd()
}
