/**
 * Secciones comunes reutilizables — light theme Cal.com.
 */
import Link from 'next/link'
import { NewsletterForm } from '@/components/site/newsletter-form'
import { getCurrentKennel } from '@/lib/kennel-context'

type Cta = { label: string; href: string; variant?: 'primary' | 'outline' | 'ghost' }

function CtaButton({ cta }: { cta: Cta }) {
  const cls = cta.variant === 'outline'
    ? 'inline-flex items-center justify-center rounded-lg border border-ink text-ink px-5 py-3 text-sm font-semibold hover:bg-ink/5 transition'
    : cta.variant === 'ghost'
      ? 'inline-flex items-center justify-center rounded-lg text-ink px-5 py-3 text-sm font-semibold hover:bg-surface-soft transition'
      : 'inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-5 py-3 text-sm font-semibold hover:opacity-90 transition'
  return <Link href={cta.href} className={cls}>{cta.label}</Link>
}

// Exportado por compat con landing.tsx
export function HeroBackground() { return null }
export const CtaButtonExport = CtaButton

export function PageHeaderSection({
  eyebrow, title, subtitle,
}: {
  eyebrow?: string
  title?: string
  subtitle?: string
}) {
  return (
    <section className="border-b border-hairline">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">{eyebrow}</p>
        )}
        {title && (
          <h1 className="text-3xl md:text-5xl font-bold text-ink tracking-tight">{title}</h1>
        )}
        {subtitle && (
          <p className="mt-4 text-lg text-body max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
    </section>
  )
}

export async function NewsletterSection({
  title, subtitle, eyebrow, placeholderEmail, ctaLabel,
}: {
  title?: string
  subtitle?: string
  eyebrow?: string
  placeholderEmail?: string
  ctaLabel?: string
}) {
  const kennel = await getCurrentKennel()
  return (
    <section className="py-16 lg:py-20 bg-surface-card border-y border-hairline">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">{eyebrow}</p>
        )}
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight">{title}</h2>
        )}
        {subtitle && (
          <p className="text-body mb-8 leading-relaxed">{subtitle}</p>
        )}
        <NewsletterForm
          kennelId={kennel.id}
          placeholderEmail={placeholderEmail}
          ctaLabel={ctaLabel}
        />
      </div>
    </section>
  )
}

export function TrustStripSection({
  title, logos = [],
}: {
  title?: string
  logos?: { label: string; url?: string; image_url?: string }[]
}) {
  if (!logos.length) return null
  return (
    <section className="py-10 lg:py-14 border-y border-hairline bg-canvas">
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

export function CtaBannerSection({
  title, subtitle, cta_label, cta_href, eyebrow, background_image_url,
}: {
  title?: string
  subtitle?: string
  cta_label?: string
  cta_href?: string
  eyebrow?: string
  background_image_url?: string
}) {
  return (
    <section className="relative py-24 lg:py-36 overflow-hidden bg-[#0a0a0a]">
      {/* Background image opcional con ken-burns */}
      {background_image_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={background_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105 opacity-60 motion-safe:animate-[ctaZoom_30s_ease-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85" />
        </>
      )}
      {/* Si no hay imagen, glow radial sutil para no quedarse en negro plano */}
      {!background_image_url && (
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.08), transparent 60%)',
          }}
        />
      )}
      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_220px_rgba(0,0,0,0.6)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {eyebrow && (
          <p className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 mb-6">
            <span className="inline-block h-px w-8 bg-white/50" />
            {eyebrow}
            <span className="inline-block h-px w-8 bg-white/50" />
          </p>
        )}
        {title && (
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-[-0.035em] leading-[1.02] drop-shadow-[0_2px_30px_rgba(0,0,0,0.5)]">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-white/85 text-lg md:text-xl mb-10 leading-[1.55] max-w-2xl mx-auto drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
            {subtitle}
          </p>
        )}
        {cta_label && cta_href && (
          <Link
            href={cta_href}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-ink px-8 py-4 text-[15px] font-semibold shadow-2xl shadow-black/40 hover:bg-white/95 hover:translate-y-[-2px] hover:shadow-3xl transition-all duration-300"
          >
            {cta_label}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      <style>{`
        @keyframes ctaZoom { 0%{transform:scale(1.05)} 100%{transform:scale(1.14)} }
      `}</style>
    </section>
  )
}
