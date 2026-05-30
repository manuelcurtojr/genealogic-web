/**
 * KennelProHome — landing de la home en /kennels/[slug] cuando el dueño es
 * Kennel Pro (o enterprise como Irema).
 *
 * Estructura:
 *  1) HERO grande: imagen/gradient + eyebrow + h1 + tagline + CTA contacto
 *  2) HIGHLIGHTS: 3 cards con bullets (sin pretender ser features)
 *  3) PERROS DESTACADOS: 4-6 fotos con link al catálogo
 *  4) FAQ EMBEBIDA (acordeón compacto, las FAQ activas del knowledge_entries)
 *  5) CTA FINAL contacto
 *
 * Filosofía: todo lo del básico que tenga sentido lo reciclamos, solo
 * cambia el tratamiento visual + añadimos secciones que para Free/Kennel
 * no tendrían contenido.
 */
import Link from 'next/link'
import {
  Sparkles, ArrowRight, MapPin, Calendar, HelpCircle, BadgeCheck,
  Globe, Dog as DogIcon, Star, Quote, Baby, Medal,
} from 'lucide-react'
import ReviewAvatar from './review-avatar'
import LeaveReviewButton from './leave-review-button'
import BlogSlider from './blog-slider'
import SectionTeasers from './section-teasers'
import StickyContactMobile from './sticky-contact-mobile'
import { pastelByName } from '@/lib/avatars'
import ContactKennelButton from './contact-kennel-button'

interface Dog {
  id: string
  slug: string | null
  name: string
  thumbnail_url: string | null
  breed?: { name?: string } | null
}

interface FAQEntry {
  id: string
  title: string
  content: string | null
  category: string | null
}

interface Review {
  id: string
  author_name: string
  body: string
  rating: number | null
  author_avatar_url?: string | null
  /** Calculado server-side: 'client' = ha reservado en este kennel,
   *  'user' = registered en Genealogic pero no cliente, null = manual (sin badge). */
  badge?: 'client' | 'user' | null
}

interface Props {
  kennel: {
    id: string
    name: string
    slug: string | null
    logo_url: string | null
    description: string | null
    about_md: string | null
    hero_image_url: string | null
    foundation_date: string | null
    city: string | null
    country: string | null
    website: string | null
    social_instagram: string | null
    social_facebook: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contact_form_config: any
    owner_id: string | null
  }
  /** Para destacados — primeras 6 fotos buenas */
  featuredDogs: Dog[]
  /** FAQ que se muestra dentro de la home Pro */
  faqEntries: FAQEntry[]
  /** Reseñas de clientes que aparecen en la home Pro */
  reviews: Review[]
  /** Últimos posts del blog para el slider — opcional */
  recentPosts?: Array<{
    id: string
    slug: string
    title: string
    excerpt: string | null
    cover_image_url: string | null
    published_at: string | null
    reading_time_minutes: number | null
  }>
  breedNames: string[]
  /** Métricas de la card "El criadero en números". El que tiene
   *  `highlight: true` se renderiza grande arriba; los demás van en
   *  un grid debajo con iconos + sublabel opcional. */
  stats: Array<{
    icon: 'calendar' | 'dog' | 'baby' | 'sparkles' | 'medal'
    value: string
    label: string
    sublabel?: string
    highlight?: boolean
  }>
  /** 3 bloques alternados (Sobre nosotros · Nuestros perros · Galería)
   *  con foto + texto + CTA. Sustituye al antiguo bloque "Trayectoria".
   *  Solo se renderizan los que tienen contenido real disponible. */
  teasers: Array<{
    id: string
    eyebrow: string
    title: string
    body: string
    ctaLabel: string
    ctaHref: string
    imageUrl: string | null
    imageAlt: string
  }>
  /** Próxima camada / disponibilidad — si hay una próxima camada
   *  planificada o cachorros disponibles, info para destacarlo. */
  availability: {
    nextLitter?: {
      id: string
      father?: { name: string; thumbnail_url: string | null } | null
      mother?: { name: string; thumbnail_url: string | null } | null
      breedName?: string | null
      expectedDate?: string | null
      status: string
    } | null
    availablePuppiesCount: number
  }
}

/**
 * Trunca un texto en el último límite de palabra antes de maxChars.
 * Sin "…" — corta limpio. Si el texto es más corto que maxChars devuelve
 * el original. Si maxChars cae a mitad de palabra, retrocede al espacio
 * anterior; si tampoco hay, hace un slice duro.
 */
function truncateAtWord(text: string, maxChars: number): string {
  const t = text.trim()
  if (t.length <= maxChars) return t
  const slice = t.slice(0, maxChars)
  // Busca el último espacio/punto/coma antes del límite
  const lastBreak = Math.max(
    slice.lastIndexOf(' '),
    slice.lastIndexOf('\n'),
  )
  if (lastBreak < maxChars * 0.6) {
    // No hay buen punto de corte; usamos el slice duro
    return slice.trimEnd()
  }
  return slice.slice(0, lastBreak).trimEnd()
}

export default function KennelProHome({
  kennel, featuredDogs, faqEntries, reviews, recentPosts = [],
  breedNames, stats, teasers, availability,
}: Props) {
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const foundationYear = kennel.foundation_date ? new Date(kennel.foundation_date).getFullYear() : null
  // Tagline del hero: usamos hasta 320 chars y cortamos en el último
  // límite de palabra (espacio o salto de línea), NO en medio de palabra
  // ni con '…'. Si el description es más corto, se muestra entero.
  const tagline = kennel.description
    ? truncateAtWord(kennel.description, 320)
    : null
  const hasOwner = !!kennel.owner_id

  return (
    <div className="space-y-16 sm:space-y-24 lg:space-y-28 pb-20 sm:pb-0">

      {/* Sticky mobile CTA (solo aparece tras pasar el hero) */}
      {hasOwner && (
        <StickyContactMobile
          kennelId={kennel.id}
          kennelName={kennel.name}
          contactFormConfig={kennel.contact_form_config}
        />
      )}

      {/* ════ HERO ════
           Full-bleed: extiende a 100vw para que el fondo llegue a los
           extremos de la pantalla (sin borders ni rounded). El contenido
           se mantiene dentro de max-w-7xl centrado, alineado con el
           resto de secciones del home.
           El truco margin-left: calc(50% - 50vw) rompe el max-w del
           dashboard padre. El padre tiene overflow controlado, así que
           no causa scrollbar horizontal. */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-orange-50/70 via-canvas to-blue-50/70"
        style={{
          marginLeft: 'calc(50% - 50vw)',
          marginRight: 'calc(50% - 50vw)',
          width: '100vw',
          maxWidth: '100vw',
        }}
      >
        {/* Glow marca */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-20 h-[500px] w-[500px] rounded-full blur-3xl opacity-50"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(254,102,32,0.4) 0%, rgba(254,102,32,0.12) 40%, transparent 70%)',
          }}
        />
        {/* Glow azul secundario */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.1) 40%, transparent 70%)',
          }}
        />

        {/* Contenedor interno con el ancho del dashboard para que el
            contenido quede alineado al resto del home */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8 lg:gap-12 py-10 sm:py-14 lg:py-20">

          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                {kennel.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={kennel.logo_url} alt={kennel.name} className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: pastelByName(kennel.name) }}
                  >
                    <span className="text-2xl sm:text-3xl font-semibold text-white">{kennel.name[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Criadero</span>
                  {hasOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      <BadgeCheck className="h-3 w-3" /> Verificado
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] sm:text-[12.5px] text-muted">
                  {location && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {location}</span>
                  )}
                  {foundationYear && (
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Desde {foundationYear}</span>
                  )}
                </div>
              </div>
            </div>

            <h1
              className="font-semibold text-ink leading-[1.02] tracking-[-0.045em] break-words"
              style={{ fontSize: 'clamp(34px, 5.5vw, 64px)' }}
            >
              {kennel.name}
            </h1>

            {tagline && (
              <p className="text-[16px] sm:text-[18px] text-body leading-[1.5] max-w-[640px]">
                {tagline}
              </p>
            )}

            {/* Hint dinámico de disponibilidad en el hero — solo si hay novedad
                que vender ahora mismo. Pequeño badge animado tipo "señal
                en vivo" que ancla al bloque AvailabilitySection más abajo. */}
            {(availability.nextLitter || availability.availablePuppiesCount > 0) && (
              <a
                href="#disponibilidad"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-900 hover:bg-emerald-100 transition w-fit"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {availability.availablePuppiesCount > 0
                  ? `${availability.availablePuppiesCount} ${availability.availablePuppiesCount === 1 ? 'cachorro disponible' : 'cachorros disponibles'} ahora`
                  : 'Próxima camada planificada'}
              </a>
            )}

            {breedNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {breedNames.slice(0, 5).map(b => (
                  <span key={b} className="inline-flex items-center rounded-full bg-canvas border border-hairline px-3 py-1 text-[12px] font-medium text-body">
                    {b}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {hasOwner && (
                <ContactKennelButton
                  kennelId={kennel.id}
                  kennelName={kennel.name}
                  config={kennel.contact_form_config || null}
                />
              )}
              <Link
                href={`/kennels/${kennel.slug}/perros`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-4 py-2.5 text-[13.5px] font-bold hover:border-ink/30 transition"
              >
                Ver nuestros perros <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Stats card — "El criadero en números" rediseñado.
              Estructura:
                · eyebrow "Trayectoria"
                · highlight: el stat con `highlight: true` arriba grande
                  (típicamente "X años · Desde 1975" — el dato más
                  vendedor de un criadero histórico)
                · grid de secundarios con icono + número + sublabel
              Sin redes sociales — ya viven en el footer fusionado. */}
          {stats.length > 0 && (() => {
            const highlight = stats.find(s => s.highlight)
            const rest = stats.filter(s => !s.highlight)
            const iconFor = (id: typeof stats[number]['icon']) => {
              switch (id) {
                case 'calendar':  return Calendar
                case 'dog':       return DogIcon
                case 'baby':      return Baby
                case 'sparkles':  return Sparkles
                case 'medal':     return Medal
              }
            }
            return (
              <aside className="rounded-2xl bg-canvas/90 backdrop-blur-md border border-hairline shadow-[0_4px_24px_rgba(0,0,0,0.04)] self-start w-full overflow-hidden">
                <div className="p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#FE6620]">
                    Trayectoria
                  </p>

                  {highlight && (() => {
                    const HIcon = iconFor(highlight.icon)
                    return (
                      <div className="mt-3 pb-5 border-b border-hairline">
                        <div className="flex items-baseline gap-2">
                          <p className="text-[44px] sm:text-[56px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-[0.95]">
                            {highlight.value}
                          </p>
                          <p className="text-[16px] sm:text-[18px] font-medium text-body tracking-[-0.01em]">
                            {highlight.label}
                          </p>
                        </div>
                        {highlight.sublabel && (
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] text-muted">
                            <HIcon className="h-3 w-3" />
                            {highlight.sublabel}
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  {rest.length > 0 && (
                    // Tailwind no soporta clases dinámicas (JIT scan), por eso
                    // mapeamos explícitamente.
                    <div className={`${highlight ? 'mt-4' : 'mt-3'} grid gap-3 sm:gap-4 ${
                      rest.length === 1 ? 'grid-cols-1'
                      : rest.length === 2 ? 'grid-cols-2'
                      : 'grid-cols-3'
                    }`}>
                      {rest.map(s => {
                        const Icon = iconFor(s.icon)
                        const isLong = s.value.length > 6
                        return (
                          <div key={s.label} className="min-w-0">
                            <Icon className="h-3.5 w-3.5 text-muted mb-1.5" strokeWidth={2} />
                            <p className={`${isLong ? 'text-[15px]' : 'text-[22px] sm:text-[26px] tabular-nums'} font-semibold tracking-[-0.025em] text-ink leading-tight truncate`}>
                              {s.value}
                            </p>
                            <p className="mt-1 text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted truncate">
                              {s.label}
                            </p>
                            {s.sublabel && (
                              <p className="mt-0.5 text-[10.5px] text-muted/80 truncate">
                                {s.sublabel}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </aside>
            )
          })()}
        </div>
      </section>

      {/* ════ DISPONIBILIDAD — qué hay disponible AHORA ════
           Va arriba porque es la sección que el visitante busca cuando
           aterriza: próxima camada / cachorros disponibles. */}
      {(availability.nextLitter || availability.availablePuppiesCount > 0) && (
        <AvailabilitySection
          availability={availability}
          kennelSlug={kennel.slug || kennel.id}
          kennelId={kennel.id}
          kennelName={kennel.name}
          contactFormConfig={kennel.contact_form_config}
          hasOwner={hasOwner}
        />
      )}

      {/* ════ TEASERS DE SECCIONES — tour visual ════
           3 filas alternadas (foto IZQ → DCHA → IZQ) que presentan:
           Sobre nosotros · Nuestros perros · Galería. Sustituyen al
           grid "Perros destacados" y al bloque "Trayectoria en números"
           con algo más vendedor y narrativo: foto grande + cuento corto
           + CTA al detalle.
           Cada fila solo se renderiza si la sección tiene contenido
           real disponible (about_md, dogs con foto, galería con fotos). */}
      <SectionTeasers teasers={teasers} />

      {/* ════ ESTADO VACÍO — solo si el criador acaba de empezar ════
           Si no hay teasers (sin about_md, sin perros con foto, sin
           galería con fotos), Y no hay disponibilidad, mostramos una
           guía visible al visitante explicando que el criadero está
           recién montando su web. Para el owner es además un CTA grande
           hacia el editor. */}
      {teasers.length === 0
        && !availability.nextLitter
        && availability.availablePuppiesCount === 0 && (
        <section className="rounded-3xl border border-dashed border-hairline bg-surface-soft p-8 sm:p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted" />
          <h2 className="mt-4 text-[20px] sm:text-[24px] font-semibold tracking-[-0.03em] text-ink">
            {hasOwner ? `Acabas de crear ${kennel.name}` : `${kennel.name} está empezando`}
          </h2>
          <p className="mt-2 text-[14px] sm:text-[15px] text-body max-w-md mx-auto leading-snug">
            {hasOwner
              ? 'Sube fotos a tu galería, escribe tu historia y añade tus perros para que tu web se vea increíble.'
              : 'Pronto encontrarás aquí los perros, la historia y todo lo que hace único a este criadero.'}
          </p>
          {hasOwner && (
            <Link
              href="/kennel/contenido/sobre"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-[13.5px] font-bold hover:opacity-90 transition"
            >
              Empezar a llenar mi web <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </section>
      )}

      {/* ════ RESEÑAS DE CLIENTES ════ */}
      <section>
        <div className="flex items-end justify-between gap-3 flex-wrap mb-5 sm:mb-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">La voz de los clientes</p>
            <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
              {reviews.length > 0 ? 'Lo que dicen las familias' : 'Comparte tu experiencia'}
            </h2>
            {/* Calificación media + count — solo si hay >=2 reseñas con rating */}
            {(() => {
              const rated = reviews.filter(r => r.rating && r.rating > 0)
              if (rated.length < 2) return null
              const avg = rated.reduce((sum, r) => sum + (r.rating || 0), 0) / rated.length
              const rounded = Math.round(avg * 10) / 10
              return (
                <div className="mt-2.5 inline-flex items-center gap-2">
                  <div className="inline-flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-hairline'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[14px] font-semibold text-ink tabular-nums">
                    {rounded.toLocaleString('es-ES')}
                  </span>
                  <span className="text-[12.5px] text-muted">
                    · {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
                  </span>
                </div>
              )
            })()}
          </div>
          <LeaveReviewButton kennelId={kennel.id} kennelSlug={kennel.slug || kennel.id} />
        </div>
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {reviews.slice(0, 6).map(r => (
              <article
                key={r.id}
                className="relative rounded-2xl border border-hairline bg-canvas p-5 sm:p-6 flex flex-col gap-3"
              >
                <Quote className="absolute top-4 right-4 h-5 w-5 text-[#FE6620]/30" />
                {r.rating && (
                  <div className="inline-flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < (r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-hairline'}`}
                      />
                    ))}
                  </div>
                )}
                <p className="text-[13.5px] sm:text-[14px] text-body leading-[1.6] whitespace-pre-line">
                  {r.body}
                </p>
                <div className="mt-auto pt-3 border-t border-hairline flex items-center gap-2.5">
                  <ReviewAvatar name={r.author_name} avatarUrl={r.author_avatar_url} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-ink truncate">{r.author_name}</p>
                    {r.badge === 'client' && (
                      <span className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider">
                        <BadgeCheck className="h-2.5 w-2.5" /> Cliente
                      </span>
                    )}
                    {r.badge === 'user' && (
                      <span className="inline-flex items-center mt-0.5 rounded-full bg-blue-100 text-blue-900 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider">
                        Usuario
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-8 text-center">
            <p className="text-[14px] font-semibold text-ink">Sé el primero en dejar una reseña</p>
            <p className="mt-1 text-[12.5px] text-body max-w-md mx-auto leading-snug">
              ¿Has tratado con {kennel.name}? Cuenta tu experiencia y ayuda a otras familias a decidir.
            </p>
          </div>
        )}
      </section>

      {/* ════ FAQ embebida ════ */}
      {faqEntries.length > 0 && (
        <section>
          <div className="mb-5 sm:mb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Antes de contactar</p>
            <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
              Preguntas frecuentes
            </h2>
          </div>
          <div className="rounded-2xl border border-hairline bg-canvas divide-y divide-hairline">
            {faqEntries.slice(0, 8).map(entry => (
              <details key={entry.id} className="group">
                <summary className="flex items-start gap-3 cursor-pointer list-none p-4 sm:p-5 hover:bg-surface-soft transition-colors">
                  <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted group-open:text-[#FE6620] transition-colors" />
                  <span className="flex-1 text-[14px] sm:text-[14.5px] font-semibold text-ink leading-snug">
                    {entry.title}
                  </span>
                  <span className="text-muted text-lg leading-none transition-transform group-open:rotate-45 select-none">+</span>
                </summary>
                {entry.content && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-11 sm:pl-12 text-[13.5px] text-body leading-[1.6] whitespace-pre-line">
                    {entry.content}
                  </div>
                )}
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ════ BLOG SLIDER ════ */}
      {recentPosts.length > 0 && kennel.slug && (
        <section>
          <div className="flex items-end justify-between gap-3 flex-wrap mb-5 sm:mb-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Desde el blog</p>
              <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
                Últimas notas
              </h2>
            </div>
            <Link
              href={`/kennels/${kennel.slug}/blog`}
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-body hover:text-ink transition"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <BlogSlider posts={recentPosts} kennelSlug={kennel.slug} />
        </section>
      )}

      {/* Footer (newsletter + identidad) — montado desde layout.tsx para
          que aparezca en TODAS las páginas del kennel Pro, no solo en home. */}

    </div>
  )
}

/**
 * AvailabilitySection — sección "qué hay disponible ahora" que sustituye
 * a los highlights estáticos. Es el equivalente a "Productos disponibles"
 * en un ecommerce: lo que el visitante busca al aterrizar.
 *
 * Renderiza un card grande con:
 *  - Si hay próxima camada confirmada: foto padre + madre + fecha esperada
 *    + CTA "Apúntate a la lista de espera"
 *  - Si hay cachorros en venta: counter destacado + CTA "Ver disponibles"
 *  - Si ambos: dos sub-cards
 */
function AvailabilitySection({
  availability, kennelSlug, kennelId, kennelName, contactFormConfig, hasOwner,
}: {
  availability: NonNullable<Props['availability']>
  kennelSlug: string
  kennelId: string
  kennelName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactFormConfig: any
  hasOwner: boolean
}) {
  const STATUS_LABEL: Record<string, string> = {
    planned: 'Camada planificada',
    mated: 'En gestación',
    confirmed: 'En gestación',
    pending: 'En gestación',
    born: 'Recién nacidos',
    delivered: 'Entregados',
  }

  const litter = availability.nextLitter
  const hasPuppies = availability.availablePuppiesCount > 0
  const showLitter = !!litter
  const both = showLitter && hasPuppies

  return (
    <section id="disponibilidad" className="scroll-mt-20">
      <div className="mb-5 sm:mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#FE6620]">Disponible ahora</p>
          <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
            {showLitter && hasPuppies
              ? 'Próxima camada y cachorros disponibles'
              : showLitter
                ? 'Próxima camada'
                : 'Cachorros disponibles'}
          </h2>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${both ? 'lg:grid-cols-2' : ''} gap-4 sm:gap-5`}>
        {showLitter && litter && (
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-orange-50/60 via-canvas to-canvas p-5 sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 h-[200px] w-[200px] rounded-full blur-3xl opacity-50"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(254,102,32,0.3) 0%, transparent 70%)' }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-3.5 w-3.5 text-[#FE6620]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FE6620]">
                  {STATUS_LABEL[litter.status] || 'Próxima camada'}
                </p>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <ParentMini name={litter.father?.name || '—'} thumbnail={litter.father?.thumbnail_url || null} />
                <span className="text-[18px] font-bold text-muted">×</span>
                <ParentMini name={litter.mother?.name || '—'} thumbnail={litter.mother?.thumbnail_url || null} />
              </div>
              <p className="text-[14px] sm:text-[15px] font-semibold text-ink mb-1">
                {litter.father?.name && litter.mother?.name
                  ? `${litter.father.name} × ${litter.mother.name}`
                  : 'Próxima camada'}
              </p>
              {litter.breedName && (
                <p className="text-[12.5px] text-muted">{litter.breedName}</p>
              )}
              {litter.expectedDate && (
                <p className="mt-3 text-[13.5px] text-body">
                  <strong className="text-ink">{formatExpected(litter.expectedDate, litter.status)}</strong>
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/litters/${litter.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2 text-[12.5px] font-bold hover:opacity-90 transition"
                >
                  Ver camada <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {hasOwner && (
                  <ContactKennelButton
                    kennelId={kennelId}
                    kennelName={kennelName}
                    config={contactFormConfig || null}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {hasPuppies && (
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-amber-50/70 via-canvas to-canvas p-5 sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 h-[200px] w-[200px] rounded-full blur-3xl opacity-50"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.3) 0%, transparent 70%)' }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <DogIcon className="h-3.5 w-3.5 text-amber-700" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                  En venta ahora mismo
                </p>
              </div>
              <p className="text-[44px] sm:text-[56px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-none">
                {availability.availablePuppiesCount}
              </p>
              <p className="mt-2 text-[14px] sm:text-[15px] text-body">
                {availability.availablePuppiesCount === 1
                  ? 'cachorro buscando familia'
                  : 'cachorros buscando familia'}
              </p>
              <div className="mt-5">
                <Link
                  href={`/kennels/${kennelSlug}/perros`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2 text-[12.5px] font-bold hover:opacity-90 transition"
                >
                  Ver disponibles <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ParentMini({ name, thumbnail }: { name: string; thumbnail: string | null }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="h-9 w-9 rounded-full overflow-hidden border border-hairline bg-surface-card flex-shrink-0">
        {thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={thumbnail} alt={name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <DogIcon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}

function formatExpected(iso: string, status: string): string {
  try {
    const d = new Date(iso)
    const mes = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    if (status === 'mated' || status === 'confirmed' || status === 'pending') {
      return `Nacimiento esperado en ${mes}`
    }
    if (status === 'planned') {
      return `Planificada para ${mes}`
    }
    if (status === 'born') {
      return `Nacidos en ${mes} — disponibles próximamente`
    }
    return `${mes}`
  } catch {
    return ''
  }
}
