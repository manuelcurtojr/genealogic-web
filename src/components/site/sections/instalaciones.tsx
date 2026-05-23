/**
 * Secciones "Instalaciones" — light theme.
 */
import Link from 'next/link'
import { SectionHeader } from '@/components/site/section-primitives'
import { GalleryGridLightbox } from './gallery-grid-client'

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
    <section className="relative min-h-[55vh] flex items-end overflow-hidden bg-[#0a0a0a]">
      {bg && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105 motion-safe:animate-[heroZoom_30s_ease-out_infinite_alternate]"
          />
          {/* Gradient cinematográfico que sale del CANVAS del tema (no white
             hardcoded). En BMW M el fondo es negro, en clásico sería claro
             pero los heros siempre van con foto + texto blanco. */}
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
        {title && (
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[0.95] tracking-[-0.035em] mb-5 max-w-4xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.5)]"
            style={{ fontFamily: 'var(--font-display, inherit)' }}
          >
            {title}
          </h1>
        )}
        {desc && (
          <p className="text-lg text-white/85 max-w-2xl leading-[1.55] drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">{desc}</p>
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
  // Una sola implementación tematizada: usa GalleryGridLightbox client
  // component. Soporta masonry/uniform + lightbox completo con flechas,
  // contador, swipe táctil, teclado, y backdrop var(--surface).
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeader number="05" eyebrow={eyebrow ?? 'Comunidad'} title={title} subtitle={subtitle} align="left" />
        <GalleryGridLightbox images={images} columns={columns} layout={layout} />
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
