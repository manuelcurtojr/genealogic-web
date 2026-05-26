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
  ExternalLink, Globe, Dog as DogIcon, Star, Quote,
} from 'lucide-react'
import ReviewAvatar from './review-avatar'
import LeaveReviewButton from './leave-review-button'
import NewsletterSubscribe from './newsletter-subscribe'
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
  stats: { value: number; label: string }[]
}

export default function KennelProHome({
  kennel, featuredDogs, faqEntries, reviews, recentPosts = [], breedNames, stats,
}: Props) {
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const foundationYear = kennel.foundation_date ? new Date(kennel.foundation_date).getFullYear() : null
  const tagline = kennel.description
    ? (kennel.description.length > 200
        ? kennel.description.slice(0, 200).trimEnd().replace(/[,;:.\s]+$/, '') + '…'
        : kennel.description)
    : null
  const hasOwner = !!kennel.owner_id

  return (
    <div className="space-y-14 sm:space-y-20">

      {/* ════ HERO ════ */}
      <section className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-orange-50/70 via-canvas to-blue-50/70">
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

        <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8 lg:gap-12 p-6 sm:p-10 lg:p-14">

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

          {/* Stats card */}
          {stats.length > 0 && (
            <aside className="rounded-2xl bg-canvas/85 backdrop-blur-md border border-hairline p-5 sm:p-6 self-start w-full">
              <div className="flex items-center gap-1.5 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-[#FE6620]" />
                <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink">El criadero en números</p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {stats.map(s => (
                  <div key={s.label} className="min-w-0">
                    <p className="text-[24px] sm:text-[28px] font-semibold tabular-nums tracking-[-0.03em] text-ink leading-none">
                      {s.value.toLocaleString('es-ES')}
                    </p>
                    <p className="mt-1.5 text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Redes en la stats card */}
              {(kennel.social_instagram || kennel.social_facebook || kennel.website) && (
                <div className="mt-5 pt-4 border-t border-hairline flex flex-wrap gap-1.5">
                  {kennel.website && (
                    <a
                      href={kennel.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-canvas px-2.5 py-1 text-[11px] font-medium text-body hover:border-ink/30 hover:text-ink transition"
                    >
                      <Globe className="h-3 w-3" /> Web
                    </a>
                  )}
                  {kennel.social_instagram && (
                    <a
                      href={kennel.social_instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-canvas px-2.5 py-1 text-[11px] font-medium text-body hover:border-ink/30 hover:text-ink transition"
                    >
                      <ExternalLink className="h-3 w-3" /> Instagram
                    </a>
                  )}
                  {kennel.social_facebook && (
                    <a
                      href={kennel.social_facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-canvas px-2.5 py-1 text-[11px] font-medium text-body hover:border-ink/30 hover:text-ink transition"
                    >
                      <ExternalLink className="h-3 w-3" /> Facebook
                    </a>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>
      </section>

      {/* ════ PERROS DESTACADOS ════ */}
      {featuredDogs.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-3 mb-5 sm:mb-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Conoce a los protagonistas</p>
              <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
                Nuestros perros
              </h2>
            </div>
            <Link
              href={`/kennels/${kennel.slug}/perros`}
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-body hover:text-ink transition"
            >
              Ver todo el catálogo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {featuredDogs.slice(0, 6).map(d => (
              <Link
                key={d.id}
                href={`/dogs/${d.slug || d.id}`}
                className="group overflow-hidden rounded-2xl border border-hairline bg-canvas hover:border-ink/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-card">
                  {d.thumbnail_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={d.thumbnail_url}
                      alt={d.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <DogIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-[13.5px] font-medium text-ink">{d.name}</p>
                  {d.breed?.name && (
                    <p className="mt-0.5 truncate text-[11px] text-muted">{d.breed.name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ════ HIGHLIGHTS — 3 valores propios del criadero ════ */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <HighlightCard
            title="Genealogía verificable"
            body={`Cada perro de ${kennel.name} tiene su árbol completo, sus papeles digitalizados y su historial disponible en su ficha.`}
          />
          <HighlightCard
            title="Cría responsable"
            body="Camadas planificadas con criterio de salud, temperamento y estándar de la raza. Nada de cría aleatoria."
          />
          <HighlightCard
            title="Contacto directo"
            body={hasOwner
              ? `Escríbenos desde el formulario, respondemos personalmente — sin intermediarios.`
              : `Próximamente más información directa del criadero.`}
          />
        </div>
      </section>

      {/* ════ RESEÑAS DE CLIENTES ════ */}
      <section>
        <div className="flex items-end justify-between gap-3 flex-wrap mb-5 sm:mb-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">La voz de los clientes</p>
            <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
              {reviews.length > 0 ? 'Lo que dicen las familias' : 'Comparte tu experiencia'}
            </h2>
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
          {/* Scroll horizontal en mobile, grid 3 cols en desktop */}
          <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-hide sm:overflow-visible">
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 px-4 sm:px-0 snap-x snap-mandatory">
              {recentPosts.slice(0, 6).map(post => {
                const date = post.published_at ? new Date(post.published_at) : null
                return (
                  <Link
                    key={post.id}
                    href={`/kennels/${kennel.slug}/blog/${post.slug}`}
                    className="group flex-shrink-0 w-[78%] sm:w-auto snap-start flex flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas hover:border-ink/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition"
                  >
                    <div className="relative aspect-[16/10] bg-surface-card overflow-hidden">
                      {post.cover_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={post.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          <DogIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-[14.5px] font-semibold text-ink leading-snug tracking-[-0.01em]">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-1.5 text-[12.5px] text-body line-clamp-2 leading-snug">{post.excerpt}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-hairline flex items-center gap-2 text-[11px] text-muted">
                        {date && <span>{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        {post.reading_time_minutes && (
                          <>
                            <span>·</span>
                            <span>{post.reading_time_minutes} min</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════ NEWSLETTER SUBSCRIBE ════ */}
      <NewsletterSubscribe kennelId={kennel.id} kennelName={kennel.name} />

      {/* ════ CTA FINAL ════ */}
      {hasOwner && (
        <section className="rounded-2xl border border-hairline bg-surface-soft p-6 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.6fr] gap-5 sm:gap-8 items-center">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Hablemos</p>
              <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold tracking-[-0.03em] text-ink leading-[1.15]">
                ¿Te interesa una camada o un perro?
              </h2>
              <p className="mt-2 text-[14.5px] sm:text-[15.5px] text-body leading-[1.55] max-w-prose">
                Escríbenos por el formulario. Te respondemos en menos de 24 horas. Sin compromiso.
              </p>
            </div>
            <div className="flex sm:justify-end">
              <ContactKennelButton
                kennelId={kennel.id}
                kennelName={kennel.name}
                config={kennel.contact_form_config || null}
              />
            </div>
          </div>
        </section>
      )}

    </div>
  )
}

function HighlightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
      <p className="text-[14.5px] sm:text-[15px] font-semibold text-ink tracking-[-0.01em] leading-snug">
        {title}
      </p>
      <p className="mt-2 text-[13px] sm:text-[13.5px] text-body leading-[1.55]">
        {body}
      </p>
    </div>
  )
}
