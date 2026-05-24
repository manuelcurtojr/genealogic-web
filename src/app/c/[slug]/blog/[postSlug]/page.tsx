/**
 * Página de detalle de un post del blog del kennel.
 * Hereda el theme + header + footer del layout /c/[slug].
 */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getKennelBySlug } from '@/lib/kennel-site'
import { getPostBySlug, getPublishedPostsByKennel } from '@/lib/kennel/data'

export const dynamic = 'force-dynamic'

type Params = { slug: string; postSlug: string }

function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

/**
 * Renderiza el body del post. El body viene como JSONB con varias formas
 * posibles según el origen:
 *   - { html: "<p>...</p>" }   ← lo que importamos de Pawdoq
 *   - { type: "doc", content: [...] } ← TipTap JSON
 *   - string HTML directo
 */
function PostBody({ body, fallback_text }: { body: unknown; fallback_text?: string | null }) {
  // Caso 1: body con html string
  if (body && typeof body === 'object' && 'html' in body && typeof (body as { html: string }).html === 'string') {
    return (
      <div
        className="prose-post"
        dangerouslySetInnerHTML={{ __html: (body as { html: string }).html }}
      />
    )
  }
  // Caso 2: body es un string HTML directo
  if (typeof body === 'string') {
    return <div className="prose-post" dangerouslySetInnerHTML={{ __html: body }} />
  }
  // Caso 3: fallback al texto plano si lo hay
  if (fallback_text) {
    return <div className="prose-post whitespace-pre-line">{fallback_text}</div>
  }
  return (
    <p className="text-muted italic">Este post no tiene contenido todavía.</p>
  )
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug, postSlug } = await params
  const kennel = await getKennelBySlug(slug)
  if (!kennel) notFound()

  const post = await getPostBySlug(kennel.id, postSlug)
  if (!post) notFound()

  // Posts relacionados (otros 3 del mismo kennel)
  const all = await getPublishedPostsByKennel(kennel.id, 4)
  const related = all.filter((p: { slug: string }) => p.slug !== postSlug).slice(0, 3)

  return (
    <article className="bg-canvas">
      {/* Hero del post — con cover (si la tiene) o sin */}
      {post.cover_image_url ? (
        <header className="relative min-h-[50vh] flex items-end overflow-hidden bg-[#0a0a0a]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? ''}
            className="absolute inset-0 w-full h-full object-cover scale-105 motion-safe:animate-[heroZoom_30s_ease-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15" />
          <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.55)]" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 pb-12 lg:pb-20 pt-28 w-full">
            <Link
              href={`/c/${slug}/blog`}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 hover:text-white mb-5"
            >
              ← Volver al blog
            </Link>
            {post.category_slug && (
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 mb-4">
                <span className="inline-block h-px w-8 bg-theme-accent" />
                {post.category_slug}
              </p>
            )}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[0.95] tracking-[-0.025em] drop-shadow-[0_2px_30px_rgba(0,0,0,0.5)]"
              style={{ fontFamily: 'var(--font-display, inherit)' }}
            >
              {post.title}
            </h1>
            <p className="mt-5 text-[12px] text-white/75 uppercase tracking-[0.14em] flex flex-wrap items-center gap-3">
              {fmtDate(post.published_at)}
              {post.reading_time_minutes && (
                <>
                  <span className="text-white/40">·</span>
                  {post.reading_time_minutes} min de lectura
                </>
              )}
              {post.author_name && (
                <>
                  <span className="text-white/40">·</span>
                  {post.author_name}
                </>
              )}
            </p>
          </div>
        </header>
      ) : (
        <header className="border-b border-hairline">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-20">
            <Link
              href={`/c/${slug}/blog`}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-ink mb-5"
            >
              ← Volver al blog
            </Link>
            {post.category_slug && (
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted mb-4">
                <span className="text-theme-accent font-mono">01</span>
                <span className="inline-block h-px w-8 bg-theme-accent opacity-60" />
                {post.category_slug}
              </p>
            )}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-ink leading-[0.95] tracking-[-0.025em]"
              style={{ fontFamily: 'var(--font-display, inherit)' }}
            >
              {post.title}
            </h1>
            <p className="mt-5 text-[12px] text-muted uppercase tracking-[0.14em] flex flex-wrap items-center gap-3">
              {fmtDate(post.published_at)}
              {post.reading_time_minutes && (
                <>
                  <span className="text-muted/50">·</span>
                  {post.reading_time_minutes} min de lectura
                </>
              )}
            </p>
          </div>
        </header>
      )}

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
        {post.excerpt && (
          <p className="text-lg md:text-xl text-body leading-relaxed mb-10 pb-8 border-b border-hairline">
            {post.excerpt}
          </p>
        )}
        <PostBody body={post.body} fallback_text={post.body_text} />
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="border-t border-hairline bg-surface-soft py-14 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-theme-accent font-mono text-[11px] tracking-[0.2em]">06</span>
              <span className="inline-block h-px w-8 bg-theme-accent opacity-60" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Sigue leyendo
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((p: { slug: string; title: string; excerpt?: string; cover_image_url?: string; published_at?: string; reading_time_minutes?: number; category_slug?: string }) => (
                <Link
                  key={p.slug}
                  href={`/c/${slug}/blog/${p.slug}`}
                  className="group block overflow-hidden bg-canvas ring-1 ring-hairline hover:ring-2 hover:ring-theme-accent transition-all duration-300"
                  style={{ borderRadius: 'var(--button-radius, 12px)' }}
                >
                  {p.cover_image_url && (
                    <div className="aspect-[16/9] bg-surface-card overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.cover_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
                    </div>
                  )}
                  <div className="p-5">
                    {p.category_slug && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">{p.category_slug}</p>
                    )}
                    <h3
                      className="text-[16px] font-bold text-ink leading-snug tracking-[-0.01em] group-hover:text-theme-accent transition-colors"
                      style={{ fontFamily: 'var(--font-display, inherit)' }}
                    >
                      {p.title}
                    </h3>
                    {p.excerpt && <p className="text-[13px] text-body mt-2 line-clamp-2">{p.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Prose styles tematizadas */}
      <style>{`
        .prose-post { color: var(--body); font-size: 16.5px; line-height: 1.75; }
        .prose-post h2 { color: var(--ink); font-family: var(--font-display, inherit); font-size: 1.85em; font-weight: 700; line-height: 1.15; margin-top: 2em; margin-bottom: 0.6em; letter-spacing: -0.02em; }
        .prose-post h3 { color: var(--ink); font-family: var(--font-display, inherit); font-size: 1.35em; font-weight: 700; line-height: 1.2; margin-top: 1.6em; margin-bottom: 0.5em; }
        .prose-post p { margin: 1em 0; }
        .prose-post a { color: var(--theme-accent); text-decoration: underline; text-underline-offset: 3px; }
        .prose-post a:hover { color: var(--brand); }
        .prose-post strong { color: var(--ink); font-weight: 600; }
        .prose-post em { font-style: italic; }
        .prose-post ul, .prose-post ol { padding-left: 1.5em; margin: 1em 0; }
        .prose-post ul { list-style: disc; }
        .prose-post ol { list-style: decimal; }
        .prose-post li { margin: 0.4em 0; }
        .prose-post blockquote { border-left: 3px solid var(--theme-accent); padding: 0.5em 0 0.5em 1.25em; margin: 1.5em 0; color: var(--ink); font-style: italic; }
        .prose-post img { border-radius: var(--button-radius, 12px); margin: 1.5em auto; max-width: 100%; }
        .prose-post hr { border: none; border-top: 1px solid var(--hairline); margin: 2.5em 0; }
        .prose-post code { background: var(--surface-card); padding: 2px 6px; border-radius: 4px; font-size: 0.92em; }
        @keyframes heroZoom { 0%{transform:scale(1.05)} 100%{transform:scale(1.12)} }
      `}</style>
    </article>
  )
}
