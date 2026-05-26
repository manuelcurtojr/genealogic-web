/**
 * Secciones del perfil público de criadero (/kennels/[slug]).
 *
 * Cada export es una sección renderizable. Todas comparten el contenedor
 * <SectionShell> para asegurar consistencia visual (eyebrow + h2 + padding
 * + anchor id para scroll suave desde el nav del hero).
 *
 * Filosofía: NADA editable a mano. Cada sección lee de su tabla canónica
 * (awards, kennel_posts, knowledge_entries…) y se renderiza dinámicamente.
 * Si la tabla está vacía, la sección no se muestra aunque esté enabled.
 *
 * Estilo: Cal limpio (border-hairline, rounded-2xl, type scale consistente).
 */
import Link from 'next/link'
import {
  Trophy, BookOpen, HelpCircle, Image as ImageIcon, Building2,
  MapPin, Calendar, Globe,
  MessageCircle, ArrowRight, ExternalLink,
} from 'lucide-react'
import ContactKennelButton from './contact-kennel-button'

/* ─── Shell común ─────────────────────────────────────────────────────── */

function SectionShell({
  id, eyebrow, title, children,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      // scroll-margin-top deja aire bajo el header sticky cuando se llega
      // via anchor link desde el hero
      className="scroll-mt-24"
    >
      <div className="mb-6 sm:mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{eyebrow}</p>
        <h2 className="mt-1.5 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

/* ─── ABOUT — siempre visible ────────────────────────────────────────── */

export function KennelAbout({
  description, breedNames, socials,
}: {
  description: string | null
  /** Nombres de las razas que cría (resuelto desde breed_ids). */
  breedNames: string[]
  socials: {
    instagram?: string | null
    facebook?: string | null
    youtube?: string | null
    tiktok?: string | null
    website?: string | null
    whatsapp?: string | null
  }
}) {
  const hasAnySocial = !!(socials.instagram || socials.facebook || socials.youtube || socials.tiktok || socials.website || socials.whatsapp)
  const hasDescription = !!description?.trim()
  if (!hasDescription && !breedNames.length && !hasAnySocial) return null

  return (
    <SectionShell id="sobre" eyebrow="Quiénes somos" title="Sobre el criadero">
      <div className="rounded-2xl border border-hairline bg-canvas p-6 sm:p-8">
        {hasDescription && (
          <div className="prose prose-sm sm:prose max-w-none text-body whitespace-pre-line leading-[1.6]">
            {description}
          </div>
        )}

        {breedNames.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted mb-2.5">Razas que criamos</p>
            <div className="flex flex-wrap gap-1.5">
              {breedNames.map(n => (
                <span key={n} className="inline-flex items-center rounded-full border border-hairline bg-surface-soft px-3 py-1 text-[12.5px] font-medium text-body">
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasAnySocial && (
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.instagram && (
              <SocialChip href={socials.instagram} icon={ExternalLink} label="Instagram" />
            )}
            {socials.facebook && (
              <SocialChip href={socials.facebook} icon={ExternalLink} label="Facebook" />
            )}
            {socials.youtube && (
              <SocialChip href={socials.youtube} icon={ExternalLink} label="YouTube" />
            )}
            {socials.website && (
              <SocialChip href={socials.website} icon={Globe} label="Web propia" />
            )}
            {socials.whatsapp && (
              <SocialChip href={`https://wa.me/${socials.whatsapp.replace(/\D/g, '')}`} icon={MessageCircle} label="WhatsApp" />
            )}
          </div>
        )}
      </div>
    </SectionShell>
  )
}

function SocialChip({
  href, icon: Icon, label,
}: { href: string; icon: React.ElementType; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[12.5px] font-medium text-body hover:border-ink/30 hover:text-ink transition"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  )
}

/* ─── AWARDS — toggle Kennel Pro ────────────────────────────────────── */

type AwardRow = {
  id: string
  award_type: string | null
  event_name: string | null
  date: string | null
  judge: string | null
  notes: string | null
  is_public: boolean | null
  dog: { id: string; name: string; slug: string | null } | null
}

const AWARD_TYPE_LABEL: Record<string, string> = {
  champion: 'Campeón',
  best_in_show: 'Best in Show',
  best_of_breed: 'Best of Breed',
  first_place: 'Primer puesto',
  cac: 'CAC',
  cacib: 'CACIB',
  judge_choice: 'Elección del juez',
  other: 'Logro',
}

export function KennelAwards({ awards }: { awards: AwardRow[] }) {
  if (!awards || awards.length === 0) return null

  return (
    <SectionShell id="logros" eyebrow="Reconocimientos" title="Logros y premios">
      <div className="rounded-2xl border border-hairline bg-canvas overflow-hidden">
        <ul className="divide-y divide-hairline">
          {awards.map(a => {
            const date = a.date ? new Date(a.date) : null
            const typeLabel = (a.award_type && AWARD_TYPE_LABEL[a.award_type]) || AWARD_TYPE_LABEL.other
            return (
              <li key={a.id} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider">
                      {typeLabel}
                    </span>
                    {a.event_name && (
                      <span className="text-[14px] font-medium text-ink">{a.event_name}</span>
                    )}
                  </div>
                  {a.dog && (
                    <Link
                      href={`/dogs/${a.dog.slug || a.dog.id}`}
                      className="mt-1 inline-flex items-center gap-1 text-[13px] text-body hover:text-ink transition"
                    >
                      {a.dog.name}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                  {a.notes && (
                    <p className="mt-1.5 text-[13px] text-body line-clamp-2">{a.notes}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-muted">
                    {date && <span>{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    {a.judge && <span>Juez: {a.judge}</span>}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </SectionShell>
  )
}

/* ─── BLOG — toggle Kennel Pro ──────────────────────────────────────── */

type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  reading_time_minutes: number | null
  category_slug: string | null
}

export function KennelBlog({
  posts, kennelSlug,
}: { posts: BlogPost[]; kennelSlug: string }) {
  if (!posts || posts.length === 0) return null
  const visible = posts.slice(0, 6)
  return (
    <SectionShell id="blog" eyebrow="Notas y noticias" title="Desde el criadero">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {visible.map(post => {
          const date = post.published_at ? new Date(post.published_at) : null
          return (
            <Link
              key={post.id}
              href={`/kennels/${kennelSlug}/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas transition hover:border-ink/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              <div className="relative aspect-[16/10] bg-surface-card overflow-hidden">
                {post.cover_image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={post.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <BookOpen className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                {post.category_slug && (
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted mb-1.5">
                    {post.category_slug.replace(/-/g, ' ')}
                  </p>
                )}
                <h3 className="text-[15.5px] font-semibold text-ink leading-snug tracking-[-0.01em]">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-1.5 text-[13px] text-body line-clamp-2 leading-[1.55]">{post.excerpt}</p>
                )}
                <div className="mt-3 pt-3 border-t border-hairline flex items-center gap-2 text-[11.5px] text-muted">
                  {date && <span>{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  {post.reading_time_minutes && (
                    <>
                      <span>·</span>
                      <span>{post.reading_time_minutes} min lectura</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </SectionShell>
  )
}

/* ─── FAQ — toggle Kennel Pro ───────────────────────────────────────── */

type KnowledgeEntry = {
  id: string
  title: string
  content: string | null
  category: string | null
}

export function KennelFAQ({ entries }: { entries: KnowledgeEntry[] }) {
  if (!entries || entries.length === 0) return null
  // Agrupar por categoría manteniendo orden de aparición
  const byCategory = new Map<string, KnowledgeEntry[]>()
  for (const e of entries) {
    const cat = e.category || 'General'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(e)
  }

  return (
    <SectionShell id="faq" eyebrow="Antes de contactar" title="Preguntas frecuentes">
      <div className="space-y-6">
        {Array.from(byCategory.entries()).map(([cat, items]) => (
          <div key={cat}>
            {byCategory.size > 1 && (
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{cat}</p>
            )}
            <div className="rounded-2xl border border-hairline bg-canvas divide-y divide-hairline">
              {items.map(entry => (
                <details key={entry.id} className="group">
                  <summary className="flex items-start gap-3 cursor-pointer list-none p-4 sm:p-5 hover:bg-surface-soft transition-colors">
                    <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted group-open:text-[#FE6620] transition-colors" />
                    <span className="flex-1 text-[14px] sm:text-[14.5px] font-semibold text-ink leading-snug">
                      {entry.title}
                    </span>
                    <span className="text-muted text-lg leading-none mt-0 transition-transform group-open:rotate-45 select-none">+</span>
                  </summary>
                  {entry.content && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-11 sm:pl-12 text-[13.5px] text-body leading-[1.6] whitespace-pre-line">
                      {entry.content}
                    </div>
                  )}
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

/* ─── GALLERY / FACILITIES placeholders ───────────────────────────────
   Renderiza solo un "coming soon" hasta que tengamos tabla kennel_photos.
   Para Irema (enterprise), aún sin datos, mostramos el placeholder para
   que el panel admin tenga sentido cuando active el toggle. */

export function KennelGalleryPlaceholder() {
  return (
    <SectionShell id="galeria" eyebrow="Imágenes" title="Galería">
      <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-8 sm:p-10 text-center">
        <ImageIcon className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-3 text-[14px] text-body">La galería estará disponible muy pronto.</p>
        <p className="mt-1 text-[12.5px] text-muted">Mientras tanto, mira a los perros del criadero más abajo.</p>
      </div>
    </SectionShell>
  )
}

export function KennelFacilitiesPlaceholder() {
  return (
    <SectionShell id="instalaciones" eyebrow="Dónde viven" title="Instalaciones">
      <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-8 sm:p-10 text-center">
        <Building2 className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-3 text-[14px] text-body">Las fotos de las instalaciones llegan en breve.</p>
      </div>
    </SectionShell>
  )
}

/* ─── CONTACT — siempre visible al final ─────────────────────────────── */

export function KennelContact({
  kennelId, kennelName, location, foundationYear, contactFormConfig,
}: {
  kennelId: string
  kennelName: string
  location: string
  foundationYear: number | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactFormConfig: any
}) {
  return (
    <SectionShell id="contacto" eyebrow="Hablemos" title={`Contacta con ${kennelName}`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 sm:gap-6">
        {/* Card principal — CTA + info */}
        <div className="rounded-2xl border border-hairline bg-canvas p-6 sm:p-8">
          <p className="text-[14px] sm:text-[15px] text-body leading-[1.6] max-w-prose">
            ¿Te interesa una camada futura, una monta, o quieres saber más?
            Escríbenos por el formulario y te respondemos en breve.
          </p>
          <div className="mt-5">
            <ContactKennelButton
              kennelId={kennelId}
              kennelName={kennelName}
              config={contactFormConfig || null}
            />
          </div>
        </div>

        {/* Card datos */}
        <div className="rounded-2xl border border-hairline bg-surface-soft p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted mb-3">Datos del criadero</p>
          <dl className="space-y-3 text-[13.5px]">
            {location && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted flex-shrink-0" />
                <span className="text-body">{location}</span>
              </div>
            )}
            {foundationYear && (
              <div className="flex items-start gap-2">
                <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted flex-shrink-0" />
                <span className="text-body">Fundado en {foundationYear}</span>
              </div>
            )}
          </dl>
        </div>
      </div>
    </SectionShell>
  )
}
