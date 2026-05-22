/**
 * Secciones "Instalaciones" — light theme.
 */
import Link from 'next/link'

export function FacilitiesHeroSection({
  eyebrow, title, subtitle, body, background_image_url, bg_image_url,
}: {
  eyebrow?: string
  title?: string
  subtitle?: string
  body?: string
  background_image_url?: string
  bg_image_url?: string  // alias
}) {
  const bg = background_image_url || bg_image_url
  const desc = subtitle || body
  return (
    <section className="relative min-h-[45vh] flex items-center bg-ink overflow-hidden">
      {bg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" />
      )}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 lg:py-20 w-full">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80 mb-3">{eyebrow}</p>
        )}
        {title && (
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-4">{title}</h1>
        )}
        {desc && (
          <p className="text-lg text-white/85 max-w-2xl leading-relaxed">{desc}</p>
        )}
      </div>
    </section>
  )
}

export function FacilityFeaturesSection({
  title, features = [],
}: {
  title?: string
  features?: { label: string; value: string; icon?: string }[]
}) {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-10 text-center tracking-tight">{title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="text-center rounded-xl border border-hairline bg-canvas p-5">
              {f.icon && <div className="text-2xl mb-2">{f.icon}</div>}
              <p className="text-xl font-bold text-ink">{f.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mt-1">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function GalleryGridSection({
  title, subtitle, eyebrow, images = [], columns = 3,
}: {
  title?: string
  subtitle?: string
  eyebrow?: string
  images?: { url: string; alt?: string }[]
  layout?: 'uniform' | 'masonry'
  columns?: 2 | 3 | 4
  cta?: { label: string; href: string }
}) {
  if (!images.length) {
    return (
      <section className="border-t border-hairline">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <p className="text-muted italic text-sm">Galería próximamente — estamos preparando las fotos.</p>
        </div>
      </section>
    )
  }
  const colsClass = columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(title || subtitle || eyebrow) && (
          <div className="mb-8 text-center">
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{eyebrow}</p>
            )}
            {title && <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{title}</h2>}
            {subtitle && <p className="text-body mt-2">{subtitle}</p>}
          </div>
        )}
        <div className={`grid grid-cols-1 ${colsClass} gap-3 md:gap-4`}>
          {images.map((im, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-card border border-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={im.url}
                alt={im.alt || ''}
                loading="lazy"
                className="w-full h-full object-cover hover:scale-[1.02] transition duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function VisitCtaSection({
  title, subtitle, headline, body, cta_label, cta_href, cta,
}: {
  title?: string
  subtitle?: string
  headline?: string  // alias
  body?: string      // alias
  cta_label?: string
  cta_href?: string
  cta?: { label: string; href: string }
}) {
  const t = title || headline
  const s = subtitle || body
  const c = cta || (cta_label && cta_href ? { label: cta_label, href: cta_href } : null)
  return (
    <section className="py-16 lg:py-20 bg-surface-card border-y border-hairline">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {t && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight">{t}</h2>
        )}
        {s && (
          <p className="text-body mb-8 leading-relaxed">{s}</p>
        )}
        {c && (
          <Link
            href={c.href}
            className="inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
          >
            {c.label}
          </Link>
        )}
      </div>
    </section>
  )
}
