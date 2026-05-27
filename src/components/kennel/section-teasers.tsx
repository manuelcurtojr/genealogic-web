/**
 * SectionTeasers — 3 filas alternadas con foto + texto + CTA que sirven
 * como tour visual a las páginas internas del kennel (Sobre nosotros,
 * Nuestros perros, Galería).
 *
 * Patrón clásico "alternating split layout":
 *  · Fila 1: foto IZQ, texto + CTA DCHA
 *  · Fila 2: texto + CTA IZQ, foto DCHA
 *  · Fila 3: foto IZQ, texto + CTA DCHA
 *
 * Cada fila solo se renderiza si tiene contenido real (página activa +
 * imagen disponible). Si no hay nada, la sección entera se oculta.
 *
 * Sustituye a la sección "Trayectoria — el criadero en números" como
 * presentación principal post-hero: más visual, más vendedor, lleva
 * directo a las páginas que el visitante quiere explorar.
 */
import Link from 'next/link'
import { ArrowRight, Dog as DogIcon } from 'lucide-react'
import { transformImageUrl, ImagePresets } from '@/lib/storage/image-url'

type Teaser = {
  id: string
  eyebrow: string
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
  imageUrl: string | null
  imageAlt: string
}

interface Props {
  teasers: Teaser[]
}

export default function SectionTeasers({ teasers }: Props) {
  if (teasers.length === 0) return null
  return (
    <section className="space-y-16 sm:space-y-20 lg:space-y-24">
      {teasers.map((t, i) => (
        <FeatureRow key={t.id} teaser={t} reversed={i % 2 === 1} />
      ))}
    </section>
  )
}

function FeatureRow({ teaser, reversed }: { teaser: Teaser; reversed: boolean }) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 items-center gap-6 sm:gap-10 lg:gap-14 ${
        reversed ? 'lg:[direction:rtl]' : ''
      }`}
    >
      {/* Imagen */}
      <div className={`${reversed ? 'lg:[direction:ltr]' : ''} relative`}>
        <div className="relative aspect-[4/3] sm:aspect-[5/4] lg:aspect-[6/5] overflow-hidden rounded-2xl sm:rounded-3xl border border-hairline bg-surface-card">
          {teaser.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={transformImageUrl(teaser.imageUrl, ImagePresets.teaserHero) || teaser.imageUrl}
              alt={teaser.imageAlt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <DogIcon className="h-12 w-12" />
            </div>
          )}
        </div>
      </div>

      {/* Texto + CTA */}
      <div className={`${reversed ? 'lg:[direction:ltr]' : ''} max-w-prose`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#FE6620]">
          {teaser.eyebrow}
        </p>
        <h3
          className="mt-2 font-semibold text-ink"
          style={{
            fontSize: 'clamp(24px, 3.4vw, 36px)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
          }}
        >
          {teaser.title}
        </h3>
        <p className="mt-4 text-[15px] sm:text-[16px] text-body leading-[1.6]">
          {teaser.body}
        </p>
        <Link
          href={teaser.ctaHref}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-[13.5px] font-bold hover:opacity-90 transition group"
        >
          {teaser.ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
