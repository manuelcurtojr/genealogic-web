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
  title, subtitle, eyebrow, images = [], columns = 3, layout = 'masonry',
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

  // MASONRY: usa CSS columns para layout estilo Pinterest sin librerías.
  if (layout === 'masonry') {
    const colsClass = columns === 2 ? 'sm:columns-2' : columns === 4 ? 'sm:columns-2 lg:columns-4' : 'sm:columns-2 lg:columns-3'
    return (
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {(title || subtitle || eyebrow) && (
            <div className="mb-12 lg:mb-16 text-center">
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
              {subtitle && (
                <p className="text-base md:text-lg text-body mt-4 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
              )}
            </div>
          )}
          <div className={`columns-1 ${colsClass} gap-4 lg:gap-5 [&>*]:mb-4 lg:[&>*]:mb-5`}>
            {images.map((im, i) => (
              <figure
                key={i}
                className="group relative break-inside-avoid rounded-2xl overflow-hidden bg-surface-card ring-1 ring-hairline shadow-sm hover:shadow-2xl hover:ring-ink/15 transition-all duration-500"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={im.url}
                  alt={im.alt || ''}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-[1.04] transition-transform duration-[900ms] ease-out"
                />
                {/* Overlay con gradiente + caption */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {im.alt && (
                  <figcaption className="pointer-events-none absolute bottom-0 left-0 right-0 p-5 text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <p className="text-[13.5px] font-medium leading-snug drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
                      {im.alt}
                    </p>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // UNIFORM: grid clásico (compat hacia atrás)
  const colsClass = columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(title || subtitle || eyebrow) && (
          <div className="mb-10 text-center">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted mb-3">{eyebrow}</p>
            )}
            {title && <h2 className="text-3xl md:text-4xl font-bold text-ink tracking-[-0.03em]">{title}</h2>}
            {subtitle && <p className="text-body mt-3 max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        )}
        <div className={`grid grid-cols-1 ${colsClass} gap-4 lg:gap-5`}>
          {images.map((im, i) => (
            <figure key={i} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-card ring-1 ring-hairline hover:ring-ink/15 hover:shadow-xl transition-all duration-500">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={im.url}
                alt={im.alt || ''}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {im.alt && (
                <figcaption className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  <p className="text-[13px] font-medium leading-snug drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">{im.alt}</p>
                </figcaption>
              )}
            </figure>
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
