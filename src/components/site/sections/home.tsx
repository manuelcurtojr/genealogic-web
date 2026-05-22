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
  const height = props.height === 'sm' ? 'min-h-[40vh]' : props.height === 'lg' ? 'min-h-[80vh]' : 'min-h-[55vh]'
  return (
    <section className={`relative ${height} flex items-center overflow-hidden bg-ink`}>
      {background_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={background_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
      )}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 lg:py-24 w-full">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80 mb-4">{eyebrow}</p>
        )}
        {title && (
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-4">{title}</h1>
        )}
        {subtitle && (
          <p className="text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed mb-8">{subtitle}</p>
        )}
        {ctas.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {ctas.map((c, i) => (
              <Link
                key={i}
                href={c.href}
                className={c.variant === 'outline'
                  ? 'inline-flex items-center justify-center rounded-lg border border-white/40 text-white px-5 py-3 text-sm font-medium hover:bg-white/10 transition'
                  : c.variant === 'ghost'
                    ? 'inline-flex items-center justify-center rounded-lg text-white px-5 py-3 text-sm font-medium hover:bg-white/10 transition'
                    : 'inline-flex items-center justify-center rounded-lg bg-white text-ink px-5 py-3 text-sm font-semibold hover:bg-white/90 transition'}
              >
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </div>
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
    <section className="py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {title && <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4 text-center tracking-tight">{title}</h2>}
        {subtitle && <p className="text-body text-center max-w-2xl mx-auto mb-12">{subtitle}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {pillars.map((p, i) => (
            <div key={i} className="rounded-2xl border border-hairline bg-canvas p-6 lg:p-8">
              {p.icon && <div className="text-2xl mb-3">{p.icon}</div>}
              <h3 className="text-lg font-bold text-ink mb-2">{p.title}</h3>
              <p className="text-sm text-body leading-relaxed">{p.body}</p>
            </div>
          ))}
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
    <section className="py-12 lg:py-16 border-t border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
          </div>
          <Link href={cta_href} className="text-sm font-medium text-body hover:text-ink underline">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {puppies.slice(0, 4).map(d => (
            <Link
              key={d.id}
              href={`https://genealogic.io/dogs/${d.slug || d.id}`}
              target="_blank"
              className="block rounded-xl border border-hairline bg-canvas overflow-hidden hover:border-ink/30 transition"
            >
              <div className="aspect-square bg-surface-card overflow-hidden">
                {d.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.thumbnail_url} alt={d.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-ink truncate">{d.name}</p>
                <p className="text-[11px] text-muted">{d.sex === 'male' ? 'Macho' : 'Hembra'}{d.breed?.name ? ` · ${d.breed.name}` : ''}</p>
              </div>
            </Link>
          ))}
          {puppies.length === 0 && litters.length > 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-hairline bg-canvas p-6 text-center">
              <p className="text-sm text-body">
                Sin cachorros disponibles ahora mismo, pero tenemos {litters.length} camada{litters.length === 1 ? '' : 's'} en camino.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
