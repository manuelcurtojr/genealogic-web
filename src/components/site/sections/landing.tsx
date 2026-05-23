/**
 * Bloques landing reutilizables — light theme.
 */
import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getCurrentKennel } from '@/lib/kennel-context'

export function TwoColumnBlockSection({
  title, body, image_url, image_alt, image_position = 'right', cta,
}: {
  title?: string
  body?: string
  image_url?: string
  image_alt?: string
  image_position?: 'left' | 'right'
  cta?: { label: string; href: string }
}) {
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 items-center ${image_position === 'left' ? 'md:[&>*:first-child]:order-2' : ''}`}>
          <div>
            {title && <h2 className="text-2xl md:text-3xl font-bold text-ink mb-4 tracking-tight">{title}</h2>}
            {body && <div className="text-body leading-relaxed whitespace-pre-line">{body}</div>}
            {cta && (
              <div className="mt-6">
                <Link href={cta.href} className="inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-5 py-3 text-sm font-semibold hover:opacity-90 transition">
                  {cta.label}
                </Link>
              </div>
            )}
          </div>
          {image_url && (
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-hairline bg-surface-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image_url} alt={image_alt || title || ''} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export async function ReviewsSection({
  title, eyebrow, reviews = [],
}: {
  title?: string
  eyebrow?: string
  reviews?: { quote: string; author?: string; rating?: number; avatar_url?: string }[]
}) {
  return (
    <section className="py-16 lg:py-24 bg-surface-card border-y border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(title || eyebrow) && (
          <div className="text-center mb-10">
            {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{eyebrow}</p>}
            {title && <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{title}</h2>}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-xl border border-hairline bg-canvas p-5">
              {r.rating && <p className="text-sm mb-3">{'★'.repeat(Math.min(5, Math.max(0, r.rating)))}</p>}
              <p className="text-sm text-body leading-relaxed italic mb-4">"{r.quote}"</p>
              {r.author && (
                <div className="flex items-center gap-2">
                  {r.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.avatar_url} alt={r.author} className="w-8 h-8 rounded-full object-cover" />
                  )}
                  <p className="text-[11px] font-semibold text-ink">{r.author}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function VideoEmbedSection({
  title, subtitle, video_url,
}: {
  title?: string
  subtitle?: string
  video_url?: string
}) {
  if (!video_url) return null
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {title && <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight">{title}</h2>}
        {subtitle && <p className="text-body mb-6">{subtitle}</p>}
        <div className="aspect-video rounded-2xl overflow-hidden border border-hairline bg-ink">
          <iframe src={video_url} className="w-full h-full" title={title || 'Video'} allowFullScreen />
        </div>
      </div>
    </section>
  )
}

export function PressLogosSection({
  title, logos = [],
}: {
  title?: string
  logos?: { label: string; image_url?: string }[]
}) {
  if (!logos.length) return null
  return (
    <section className="py-10 lg:py-14 border-y border-hairline">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-6 text-center">{title}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-80">
          {logos.map((l, i) => (
            <div key={i} className="text-sm text-body font-medium">
              {l.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.image_url} alt={l.label} className="h-8 w-auto object-contain" />
              ) : (
                l.label
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function KennelStatsSection({
  title, eyebrow, stats = [],
}: {
  title?: string
  eyebrow?: string
  stats?: { value: string; label: string; suffix?: string }[]
}) {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {(title || eyebrow) && (
          <div className="text-center mb-10">
            {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{eyebrow}</p>}
            {title && <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{title}</h2>}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center rounded-xl border border-hairline bg-canvas p-5">
              <p className="text-3xl md:text-4xl font-bold text-ink">{s.value}{s.suffix || ''}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProcessStepsSection({
  title, eyebrow, steps = [],
}: {
  title?: string
  eyebrow?: string
  steps?: { number?: string; title: string; body?: string }[]
}) {
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {(title || eyebrow) && (
          <div className="text-center mb-10">
            {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{eyebrow}</p>}
            {title && <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{title}</h2>}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={i} className="rounded-xl border border-hairline bg-canvas p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">
                {s.number || `0${i + 1}`}
              </p>
              <h3 className="text-base font-bold text-ink mb-2">{s.title}</h3>
              {s.body && <p className="text-sm text-body leading-relaxed">{s.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FaqSection({
  title, eyebrow, items = [],
}: {
  title?: string
  eyebrow?: string
  items?: { question: string; answer: string }[]
}) {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background pattern muy sutil */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,1) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
        {(title || eyebrow) && (
          <div className="mb-14 lg:mb-16 text-center">
            {eyebrow && (
              <p className="flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted mb-4">
                <span className="inline-block h-px w-8 bg-muted/40" />
                {eyebrow}
                <span className="inline-block h-px w-8 bg-muted/40" />
              </p>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.05]">
                {title}
              </h2>
            )}
          </div>
        )}
        <div className="divide-y divide-hairline border-y border-hairline">
          {items.map((it, i) => (
            <details key={i} className="group py-2">
              <summary className="cursor-pointer list-none flex items-start justify-between gap-6 py-5 hover:opacity-80 transition-opacity">
                <span className="text-lg md:text-xl font-semibold text-ink leading-snug tracking-[-0.01em] flex-1">
                  {it.question}
                </span>
                <span className="shrink-0 mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-hairline text-muted text-base group-open:rotate-45 group-open:border-ink/40 group-open:text-ink transition-all duration-300">
                  +
                </span>
              </summary>
              <div className="pb-6 pr-12 text-[15px] text-body leading-[1.7] whitespace-pre-line">
                {it.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export async function LatestPostsSection({ limit = 3 }: { limit?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const kennel = await getCurrentKennel()
  const { data: posts } = await admin
    .from('kennel_posts')
    .select('slug, title, excerpt, cover_image_url, published_at, reading_time_minutes')
    .eq('kennel_id', kennel.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
  if (!posts || posts.length === 0) return null
  return (
    <section className="py-12 lg:py-16 border-t border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">Últimos artículos</h2>
          <Link href="./blog" className="text-sm text-body hover:text-ink underline">Ver blog →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((p: any) => (
            <Link key={p.slug} href={`./blog/${p.slug}`} className="block group">
              <article className="rounded-xl border border-hairline bg-canvas overflow-hidden hover:border-ink/30 transition h-full flex flex-col">
                {p.cover_image_url && (
                  <div className="aspect-[16/9] bg-surface-card overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.cover_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-ink mb-1.5">{p.title}</h3>
                  {p.excerpt && <p className="text-xs text-body leading-relaxed line-clamp-2 mb-3">{p.excerpt}</p>}
                  <p className="text-[10px] text-muted mt-auto">
                    {p.published_at && new Date(p.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ChatPromoSection({
  title, subtitle, cta_label = 'Hablar con el criador', cta_href = './contacto',
}: {
  title?: string
  subtitle?: string
  cta_label?: string
  cta_href?: string
}) {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {title && <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight">{title}</h2>}
        {subtitle && <p className="text-body mb-6 leading-relaxed">{subtitle}</p>}
        <Link href={cta_href} className="inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-semibold hover:opacity-90 transition">
          {cta_label}
        </Link>
      </div>
    </section>
  )
}
