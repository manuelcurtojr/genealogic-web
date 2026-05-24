/**
 * Secciones de la home — versiones simplificadas que usan helpers locales
 * de Genealogic (no la API HTTP de Pawdoq tenant-breeder).
 */
import Link from 'next/link'
import { getCurrentKennel } from '@/lib/kennel-context'
import { getAvailablePuppiesByKennel, getUpcomingLittersByKennel } from '@/lib/kennel/data'
import { SectionHeader } from '@/components/site/section-primitives'
import { HeroCtaButton } from '@/components/site/hero-cta-button'
import { isContactPageEnabled, resolveContactHref } from '@/lib/kennel/pages'

type Cta = { label: string; href: string; variant?: 'primary' | 'outline' | 'ghost' }

export async function HeroSection(props: {
  eyebrow?: string
  title?: string
  // Aliases que vienen del schema del editor:
  tagline?: string
  tagline_emphasis?: string
  subtitle?: string
  background_image_url?: string
  bg_image_url?: string
  bg_video_url?: string
  bg_overlay_opacity?: number
  ctas?: Cta[]
  height?: 'sm' | 'md' | 'lg'
}) {
  const { eyebrow, subtitle, ctas = [] } = props
  // Acepta tanto `title` como `tagline`+`tagline_emphasis` (lo que use el editor)
  const title = props.title ?? [props.tagline, props.tagline_emphasis].filter(Boolean).join(' ')
  // Acepta tanto background_image_url como bg_image_url (alias del schema)
  const background_image_url = props.background_image_url || props.bg_image_url
  const height = props.height === 'sm' ? 'min-h-[60vh]' : props.height === 'lg' ? 'min-h-[92vh]' : 'min-h-[75vh]'
  // Datos del kennel para que el modal del CTA "Hablar con el criador" pueda
  // renderizar el formulario CUSTOM construido por el criador en /kennel.
  const kennel = await getCurrentKennel()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contactFormConfig = ((kennel as any).contact_form_config ?? null) as
    | import('@/lib/kennel/contact-form').ContactFormConfig
    | null
  // Si la página de contacto está desactivada, los CTAs que apunten a
  // /contacto se reescriben a #contacto → el modal popup se abrirá en su
  // lugar (evita 404).
  const contactPageEnabled = await isContactPageEnabled(kennel.id)
  return (
    <section className={`relative ${height} flex items-end overflow-hidden bg-[#0a0a0a]`}>
      {background_image_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={background_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105 motion-safe:animate-[heroZoom_30s_ease-out_infinite_alternate]"
          />
          {/* Gradiente cinematográfico: oscuro abajo→claro arriba para legibilidad sin tapar */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />
          {/* Vignette sutil */}
          <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.55)]" />
        </>
      )}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 pb-16 lg:pb-24 pt-32 w-full">
        {eyebrow && (
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 mb-6">
            <span className="inline-block h-px w-8 bg-white/60" />
            {eyebrow}
          </p>
        )}
        {title && (
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-bold text-white leading-[0.95] tracking-[-0.035em] mb-6 max-w-4xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.45)]">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-lg md:text-xl text-white/85 max-w-2xl leading-[1.55] mb-10 drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
            {subtitle}
          </p>
        )}
        {ctas.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {ctas.map((c, i) => (
              <HeroCtaButton
                key={i}
                href={resolveContactHref({ href: c.href, contactPageEnabled })}
                label={c.label}
                variant={c.variant}
                kennelId={kennel.id}
                kennelName={kennel.name}
                contactFormConfig={contactFormConfig}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scroll indicator sutil */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-white/50 motion-safe:animate-[heroScroll_2.5s_ease-in-out_infinite]">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Scroll</span>
        <span className="block h-6 w-px bg-white/40" />
      </div>

      {/* Keyframes para el zoom y el bounce del scroll */}
      <style>{`
        @keyframes heroZoom { 0%{transform:scale(1.05)} 100%{transform:scale(1.12)} }
        @keyframes heroScroll { 0%,100%{transform:translate(-50%,0);opacity:0.5} 50%{transform:translate(-50%,6px);opacity:1} }
      `}</style>
    </section>
  )
}

export async function ThreePillarsSection(props: {
  title?: string
  subtitle?: string
  pillars?: { icon?: string; title: string; body: string }[]
}) {
  const { title, subtitle, pillars = [] } = props
  return (
    <section className="relative py-24 lg:py-36 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeader number="01" eyebrow="La casa" title={title} subtitle={subtitle} align="center" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline rounded-none overflow-hidden border-y border-hairline">
          {pillars.map((p, i) => {
            const m = p.title.match(/^([\d.,]+\s*\S*?)\s+(.+)$/)
            const bigNumber = m ? m[1] : null
            const restTitle = m ? m[2] : p.title
            return (
              <div
                key={i}
                className="group relative bg-canvas p-10 lg:p-12 transition-colors hover:bg-surface-soft"
              >
                {/* Index number top-right como BMW M */}
                <span className="absolute top-6 right-6 text-theme-accent text-[11px] font-mono tracking-[0.2em] opacity-70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {bigNumber ? (
                  <>
                    <p
                      className="text-5xl md:text-6xl lg:text-[72px] font-bold text-ink leading-[0.9] tracking-[-0.03em] tabular-nums whitespace-nowrap"
                      style={{ fontFamily: 'var(--font-display, inherit)' }}
                    >
                      {bigNumber}
                    </p>
                    {/* Línea de acento debajo del número (signature BMW M) */}
                    <span className="block mt-4 h-[3px] w-12 bg-theme-accent" />
                    <h3 className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {restTitle}
                    </h3>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-ink leading-tight tracking-[-0.01em]">{p.title}</h3>
                    <span className="block mt-4 h-[3px] w-12 bg-theme-accent" />
                  </>
                )}
                <p className="mt-5 text-[14.5px] text-body leading-[1.7]">{p.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export async function AvailablePuppiesStripSection(props: {
  title?: string
  subtitle?: string
  cta_href?: string
  editMode?: boolean
}) {
  const { title = 'Disponibles', subtitle, cta_href = './perros', editMode } = props
  const kennel = await getCurrentKennel()
  const [puppies, litters] = await Promise.all([
    getAvailablePuppiesByKennel(kennel.id),
    getUpcomingLittersByKennel(kennel.id),
  ])

  if (puppies.length === 0 && litters.length === 0 && !editMode) return null

  return (
    <section className="py-20 lg:py-28 bg-surface-card/30 border-y border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between gap-4 mb-12 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-theme-accent font-mono text-[11px] tracking-[0.2em]">02</span>
              <span className="inline-block h-px w-8 bg-theme-accent opacity-60" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Datos en vivo
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink tracking-[-0.025em] leading-[0.95]"
              style={{ fontFamily: 'var(--font-display, inherit)' }}
            >
              {title}
            </h2>
            {subtitle && <p className="text-base text-body mt-4 max-w-xl">{subtitle}</p>}
          </div>
          <Link
            href={cta_href}
            className="group inline-flex items-center gap-2 text-[13px] font-semibold text-ink hover:text-theme-accent hover:gap-3 transition-all uppercase tracking-[0.12em]"
          >
            Ver todos
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
          {puppies.slice(0, 4).map(d => (
            <Link
              key={d.id}
              href={`https://genealogic.io/dogs/${d.slug || d.id}`}
              target="_blank"
              className="group block rounded-2xl bg-canvas overflow-hidden ring-1 ring-hairline hover:ring-2 hover:ring-ink/20 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className="relative aspect-square bg-surface-card overflow-hidden">
                {d.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.thumbnail_url} alt={d.name} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700" />
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink shadow-sm">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Disponible
                </span>
              </div>
              <div className="p-4">
                <p className="text-[15px] font-bold text-ink truncate tracking-[-0.01em]">{d.name}</p>
                <p className="text-[11.5px] text-muted mt-0.5 uppercase tracking-wider">
                  {d.sex === 'male' ? '♂ Macho' : '♀ Hembra'}
                  {d.breed?.name ? ` · ${d.breed.name}` : ''}
                </p>
              </div>
            </Link>
          ))}
          {puppies.length === 0 && litters.length > 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-hairline bg-canvas p-10 text-center">
              <p className="text-base text-body">
                Sin cachorros disponibles ahora mismo, pero tenemos{' '}
                <strong className="text-ink">{litters.length} camada{litters.length === 1 ? '' : 's'}</strong>{' '}
                en camino.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
