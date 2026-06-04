/**
 * Sección "Nuestra historia" — light theme.
 */
import { Img } from '@/components/ui/img'

export function StoryHeroSection({
  eyebrow, title, subtitle, background_image_url, bg_image_url,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  background_image_url?: string
  bg_image_url?: string
}) {
  // Acepta ambos aliases del schema (background_image_url o bg_image_url)
  const bg = background_image_url || bg_image_url
  return (
    <section className="relative min-h-[55vh] flex items-end overflow-hidden bg-[#0a0a0a]">
      {bg && (
        <>
          <Img
            w={1000}
            src={bg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105 motion-safe:animate-[heroZoom_30s_ease-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />
          <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.55)]" />
        </>
      )}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 pb-12 lg:pb-20 pt-28 w-full">
        {eyebrow && (
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 mb-5">
            <span className="inline-block h-px w-8 bg-theme-accent" />
            {eyebrow}
          </p>
        )}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[0.95] tracking-[-0.035em] mb-5 max-w-4xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.5)]"
          style={{ fontFamily: 'var(--font-display, inherit)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-white/85 max-w-2xl leading-[1.55] drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}

export function TimelineSection({
  title, items = [],
}: {
  title?: string
  items?: { year: string; title: string; body?: string; image_url?: string }[]
}) {
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-12 text-center tracking-tight">{title}</h2>
        )}
        <ol className="relative border-l border-hairline space-y-10 pl-6">
          {items.map((it, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-ink border-4 border-canvas" />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-1">{it.year}</p>
              <h3 className="text-lg font-bold text-ink mb-2 tracking-tight">{it.title}</h3>
              {it.body && (
                <p className="text-sm text-body leading-relaxed">{it.body}</p>
              )}
              {it.image_url && (
                <Img w={480} src={it.image_url} alt={it.title} className="mt-4 rounded-xl border border-hairline w-full max-w-md" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function TeamSection({
  title, members = [],
}: {
  title?: string
  members?: { name: string; role?: string; bio?: string; photo_url?: string }[]
}) {
  return (
    <section className="py-12 lg:py-16 bg-surface-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-10 text-center tracking-tight">{title}</h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {members.map((m, i) => (
            <div key={i} className="rounded-xl border border-hairline bg-canvas p-5 text-center">
              {m.photo_url && (
                <Img w={200} src={m.photo_url} alt={m.name} className="w-24 h-24 rounded-full mx-auto object-cover mb-3" />
              )}
              <p className="text-base font-bold text-ink">{m.name}</p>
              {m.role && <p className="text-xs text-muted">{m.role}</p>}
              {m.bio && <p className="text-sm text-body mt-3 leading-relaxed">{m.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
