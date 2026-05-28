/**
 * /features — catálogo completo del producto.
 *
 * Estructura:
 *   · Hero con título + tagline + CTA principal
 *   · Layout 2 columnas: sidebar sticky (categorías + features) +
 *     contenido scrolleable con mockups, bullets y featurettes
 *   · CTA final
 *
 * Estilo Linear / Stripe docs: el sidebar marca la feature activa
 * mediante scroll-spy (IntersectionObserver), y cada anchor es
 * deep-linkable (#pipeline, #pedigree, etc.).
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import FeaturesSidebar from '@/components/features-page/sidebar'
import FeaturesContent from '@/components/features-page/content'

export const metadata: Metadata = {
  title: 'Producto',
  description:
    'Todo lo que tu criadero necesita: pipeline de reservas, web pública, genealogía interactiva, emailbot, newsletter y analítica. Explora cada herramienta con mockups del producto real.',
  alternates: { canonical: 'https://genealogic.io/features' },
  openGraph: {
    title: 'El producto Genealogic',
    description: 'Pipeline · Web · Genealogía · Emailbot · Newsletter · Stats. Mira cómo se ven antes de probarlas.',
    url: 'https://genealogic.io/features',
    type: 'website',
    siteName: 'Genealogic',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Genealogic' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
  },
}

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-hairline bg-gradient-to-br from-orange-50/50 via-canvas to-blue-50/40">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-20 h-[400px] w-[400px] rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(254,102,32,0.4) 0%, rgba(254,102,32,0.1) 50%, transparent 70%)' }}
        />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#FE6620]">
            El producto
          </p>
          <h1 className="mt-3 text-[34px] sm:text-[48px] lg:text-[56px] font-semibold tracking-[-0.04em] text-ink leading-[1.05] max-w-3xl">
            Todo lo que tu criadero necesita, en un solo sitio.
          </h1>
          <p className="mt-4 text-[15px] sm:text-[17px] text-body leading-snug max-w-2xl">
            Pipeline de reservas, web pública profesional, árbol genealógico,
            emailbot que responde solo, newsletter, analítica. Mira cómo se
            ven antes de probarlas.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/register?intent=breeder"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-[14px] font-bold hover:opacity-90 transition"
            >
              Empezar gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-5 py-3 text-[14px] font-bold hover:border-ink/30 transition"
            >
              Ver precios
            </Link>
            <span className="text-[12.5px] text-muted ml-1">
              7 días de Kennel Pro · sin tarjeta
            </span>
          </div>
        </div>
      </section>

      {/* ─── CONTENT (sidebar + features) ─────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-14">
          <FeaturesSidebar />
          <div className="min-w-0">
            <FeaturesContent />
          </div>
        </div>
      </div>

      {/* ─── CTA final ────────────────────────────────────────────────── */}
      <section className="border-t border-hairline bg-gradient-to-br from-orange-50/40 via-canvas to-blue-50/30 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-[#FE6620]" />
          <h2 className="mt-4 text-[26px] sm:text-[32px] font-semibold tracking-[-0.03em] text-ink leading-tight">
            Empieza hoy. Mejora tu criadero mañana.
          </h2>
          <p className="mt-3 text-[15px] text-body leading-snug max-w-prose mx-auto">
            Sin tarjeta. Cancela cuando quieras. Migra tus perros y genealogías
            en menos de una hora.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register?intent=breeder"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-6 py-3 text-[14px] font-bold hover:opacity-90 transition"
            >
              Crear cuenta gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-6 py-3 text-[14px] font-bold hover:border-ink/30 transition"
            >
              Comparar planes
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
