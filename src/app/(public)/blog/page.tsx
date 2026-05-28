import Link from 'next/link'
import { allPosts } from '@/content/blog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guías, tutoriales y artículos sobre cría canina, genética, salud, gestión de criadero y herramientas Genealogic.',
  alternates: { canonical: 'https://genealogic.io/blog' },
  openGraph: {
    title: 'Blog',
    description:
      'Guías, tutoriales y artículos sobre cría canina, genética, salud, gestión de criadero y herramientas Genealogic.',
    url: 'https://genealogic.io/blog',
    siteName: 'Genealogic',
    type: 'website',
  },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogIndexPage() {
  const [featured, ...rest] = allPosts

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1100px] px-6 pt-16 pb-12 lg:px-12 lg:pt-24 lg:pb-16">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Blog</p>
          <h1
            className="mt-3 max-w-[20ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}
          >
            Genealogía, salud y herramientas de cría canina.
          </h1>
          <p className="mt-6 max-w-[600px] text-[18px] leading-[1.6] text-body">
            Guías técnicas, tutoriales del producto y reflexiones sobre el oficio de criador.
            Para criadores que se toman su trabajo en serio y para compradores que quieren entender lo que están comprando.
          </p>
        </div>
      </section>

      {/* Featured post */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1100px] px-6 py-14 lg:px-12 lg:py-20">
          <Link href={`/blog/${featured.meta.slug}`} className="group block">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] border border-hairline bg-surface-card">
                <img
                  src={featured.meta.heroImage}
                  alt={featured.meta.heroAlt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
                  <span>Destacado</span>
                  <span>·</span>
                  <span>{featured.meta.category}</span>
                </div>
                <h2
                  className="mt-4 font-semibold text-ink transition-colors group-hover:text-ink/80"
                  style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', lineHeight: 1.1, letterSpacing: '-0.03em' }}
                >
                  {featured.meta.title}
                </h2>
                <p className="mt-5 max-w-[520px] text-[16px] leading-[1.6] text-body">
                  {featured.meta.excerpt}
                </p>
                <div className="mt-6 flex items-center gap-3 text-[13px] text-muted">
                  <span>{formatDate(featured.meta.date)}</span>
                  <span>·</span>
                  <span>{featured.meta.readMinutes} min lectura</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Rest grid */}
      <section>
        <div className="mx-auto max-w-[1100px] px-6 py-14 lg:px-12 lg:py-20">
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {rest.map(({ meta }) => (
              <Link key={meta.slug} href={`/blog/${meta.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[12px] border border-hairline bg-surface-card">
                  <img
                    src={meta.heroImage}
                    alt={meta.heroAlt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="mt-5 flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted">
                  <span>{meta.category}</span>
                  <span>·</span>
                  <span>{meta.readMinutes} min</span>
                </div>
                <h3
                  className="mt-2 font-semibold text-ink transition-colors group-hover:text-ink/80"
                  style={{ fontSize: '22px', lineHeight: 1.2, letterSpacing: '-0.02em' }}
                >
                  {meta.title}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-body">{meta.excerpt}</p>
                <p className="mt-3 text-[12.5px] text-muted">{formatDate(meta.date)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
