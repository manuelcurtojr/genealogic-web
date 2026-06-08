import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Img } from '@/components/ui/img'
import { allPosts, getPostBySlug, getRelatedPosts } from '@/content/blog'
import { Prose } from '@/components/blog/prose'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import type { Metadata } from 'next'

export function generateStaticParams() {
  return allPosts.map(p => ({ slug: p.meta.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Artículo no encontrado — Genealogic' }
  const { meta } = post
  const url = `https://www.genealogic.io/blog/${meta.slug}`
  return {
    title: `${meta.title} — Genealogic`,
    description: meta.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.excerpt,
      url,
      siteName: 'Genealogic',
      type: 'article',
      publishedTime: meta.date,
      authors: [meta.author.name],
      images: [{ url: meta.heroImage, alt: meta.heroAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.excerpt,
      images: [meta.heroImage],
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = getTranslator(await getLocale())
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const { meta, Content } = post
  const related = getRelatedPosts(slug, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.excerpt,
    datePublished: meta.date,
    image: meta.heroImage,
    author: { '@type': 'Organization', name: meta.author.name },
    publisher: { '@type': 'Organization', name: 'Genealogic', url: 'https://www.genealogic.io' },
    mainEntityOfPage: `https://www.genealogic.io/blog/${meta.slug}`,
  }

  return (
    <div className="min-h-screen bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back link */}
      <div className="mx-auto max-w-[760px] px-6 pt-10 lg:px-0">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t('Volver al blog')}
        </Link>
      </div>

      {/* Article header */}
      <article>
        <header className="mx-auto max-w-[760px] px-6 pt-8 pb-10 lg:px-0 lg:pt-12 lg:pb-14">
          <div className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
            <span className="rounded-full bg-surface-card px-2.5 py-1">{meta.category}</span>
            <span>{meta.readMinutes} {t('min lectura')}</span>
          </div>
          <h1
            className="mt-5 font-semibold text-ink"
            style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.035em' }}
          >
            {meta.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-muted">
            <span className="text-body">{meta.author.name}</span>
            <span>·</span>
            <time dateTime={meta.date}>{formatDate(meta.date)}</time>
          </div>
        </header>

        {/* Hero image — full width container, bounded by reading width */}
        <div className="mx-auto max-w-[1100px] px-6 lg:px-12">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[14px] border border-hairline bg-surface-card">
            <Img
              w={1000}
              src={meta.heroImage}
              alt={meta.heroAlt}
              className="h-full w-full object-cover"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto max-w-[760px] px-6 py-14 lg:px-0 lg:py-20">
          <Prose>
            <Content />
          </Prose>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="border-t border-hairline bg-surface-soft">
          <div className="mx-auto max-w-[1100px] px-6 py-14 lg:px-12 lg:py-20">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
              {t('Sigue leyendo')}
            </p>
            <h2
              className="mt-3 font-semibold text-ink"
              style={{ fontSize: 'clamp(24px, 3vw, 36px)', lineHeight: 1.15, letterSpacing: '-0.025em' }}
            >
              {t('Artículos relacionados')}
            </h2>

            <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {related.map(({ meta: rm }) => (
                <Link key={rm.slug} href={`/blog/${rm.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[12px] border border-hairline bg-surface-card">
                    <Img
                      w={680}
                      src={rm.heroImage}
                      alt={rm.heroAlt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted">
                    <span>{rm.category}</span>
                    <span>·</span>
                    <span>{rm.readMinutes} {t('min')}</span>
                  </div>
                  <h3
                    className="mt-2 font-semibold text-ink transition-colors group-hover:text-ink/80"
                    style={{ fontSize: '19px', lineHeight: 1.25, letterSpacing: '-0.015em' }}
                  >
                    {rm.title}
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-[1.55] text-body">{rm.excerpt}</p>
                </Link>
              ))}
            </div>

            <Link
              href="/blog"
              className="mt-12 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink transition-colors hover:opacity-70"
            >
              {t('Ver todos los artículos')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
