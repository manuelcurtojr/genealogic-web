/**
 * Secciones de la home — versiones simplificadas que usan helpers locales
 * de Genealogic (no la API HTTP de Pawdoq tenant-breeder).
 */
import Link from 'next/link'
import { getCurrentKennel } from '@/lib/kennel-context'
import { getAvailablePuppiesByKennel, getUpcomingLittersByKennel } from '@/lib/kennel/data'

type Cta = { label: string; href: string; variant?: 'primary' | 'outline' | 'ghost' }

export async function HeroSection(props: {
  eyebrow?: string
  title?: string
  subtitle?: string
  background_image_url?: string
  ctas?: Cta[]
  height?: 'sm' | 'md' | 'lg'
}) {
  const { eyebrow, title, subtitle, background_image_url, ctas = [] } = props
  const height = props.height === 'sm' ? 'min-h-[60vh]' : props.height === 'lg' ? 'min-h-[92vh]' : 'min-h-[75vh]'
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
              <Link
                key={i}
                href={c.href}
                className={c.variant === 'outline'
                  ? 'inline-flex items-center justify-center rounded-xl border border-white/35 backdrop-blur-sm bg-white/5 text-white px-7 py-3.5 text-[14px] font-semibold hover:bg-white/15 hover:border-white/60 transition-all'
                  : c.variant === 'ghost'
                    ? 'inline-flex items-center justify-center rounded-xl text-white px-7 py-3.5 text-[14px] font-semibold hover:bg-white/10 transition-all'
                    : 'inline-flex items-center justify-center rounded-xl bg-[var(--brand)] text-[var(--on-primary)] px-7 py-3.5 text-[14px] font-semibold shadow-2xl shadow-black/30 hover:bg-[var(--brand-hover)] hover:translate-y-[-1px] hover:shadow-3xl transition-all'}
              >
                {c.label}
              </Link>
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
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background sutil con grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,1) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14 lg:mb-20">
          {title && (
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink tracking-[-0.035em] leading-[1.05]">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-5 text-lg text-body max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline rounded-2xl overflow-hidden border border-hairline">
          {pillars.map((p, i) => {
            // Si el title empieza por un número (50/12/17.000), lo separamos para hero-size
            const m = p.title.match(/^([\d.,]+\s*\S*?)\s+(.+)$/)
            const bigNumber = m ? m[1] : null
            const restTitle = m ? m[2] : p.title
            return (
              <div
                key={i}
                className="group relative bg-canvas p-8 lg:p-10 transition-colors hover:bg-surface-soft"
              >
                {p.icon && (
                  <div className="text-3xl mb-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                    {p.icon}
                  </div>
                )}
                {bigNumber ? (
                  <>
                    <p className="text-5xl md:text-6xl font-bold text-ink leading-none tracking-[-0.03em] tabular-nums">
                      {bigNumber}
                    </p>
                    <h3 className="mt-2 text-[15px] font-semibold uppercase tracking-[0.06em] text-muted">
                      {restTitle}
                    </h3>
                  </>
                ) : (
                  <h3 className="text-2xl font-bold text-ink leading-tight">{p.title}</h3>
                )}
                <p className="mt-4 text-[14px] text-body leading-[1.6]">{p.body}</p>
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
    <section className="py-16 lg:py-24 bg-surface-card/30 border-y border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted mb-3 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Datos en vivo
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.05]">
              {title}
            </h2>
            {subtitle && <p className="text-base text-body mt-3 max-w-xl">{subtitle}</p>}
          </div>
          <Link
            href={cta_href}
            className="group inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink hover:gap-3 transition-all"
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
