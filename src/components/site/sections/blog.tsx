/**
 * Secciones de Blog — leen de kennel_posts. Light theme.
 */
import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getCurrentKennel } from '@/lib/kennel-context'

type Post = {
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  reading_time_minutes: number | null
  category_slug: string | null
}

async function getPublishedPosts(kennelId: string, limit: number, pinnedOnly = false): Promise<Post[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  let q = admin
    .from('kennel_posts')
    .select('slug, title, excerpt, cover_image_url, published_at, reading_time_minutes, category_slug, pinned')
    .eq('kennel_id', kennelId)
    .eq('status', 'published')
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)
  if (pinnedOnly) q = q.eq('pinned', true)
  const { data } = await q
  return (data as Post[] | null) ?? []
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BlogHeroSection({ eyebrow, title, subtitle }: { eyebrow?: string; title?: string; subtitle?: string }) {
  return (
    <section className="border-b border-hairline">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">{eyebrow}</p>
        )}
        {title && <h1 className="text-3xl md:text-5xl font-bold text-ink tracking-tight">{title}</h1>}
        {subtitle && <p className="mt-4 text-lg text-body max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
    </section>
  )
}

export async function FeaturedPostSection({ mode = 'latest' }: { mode?: 'latest' | 'pinned' }) {
  const kennel = await getCurrentKennel()
  const posts = await getPublishedPosts(kennel.id, 1, mode === 'pinned')
  if (!posts.length) return null
  const p = posts[0]
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Link href={`./blog/${p.slug}`} className="block group">
          <article className="rounded-2xl border border-hairline bg-canvas overflow-hidden hover:border-ink/30 hover:shadow-sm transition">
            {p.cover_image_url && (
              <div className="aspect-[21/9] bg-surface-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 lg:p-8">
              {p.category_slug && (
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{p.category_slug}</p>
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight mb-3">{p.title}</h2>
              {p.excerpt && <p className="text-body leading-relaxed">{p.excerpt}</p>}
              <p className="text-xs text-muted mt-4">
                {fmtDate(p.published_at)}
                {p.reading_time_minutes ? ` · ${p.reading_time_minutes} min` : ''}
              </p>
            </div>
          </article>
        </Link>
      </div>
    </section>
  )
}

export async function PostsGridSection({ limit = 9, title, eyebrow }: { limit?: number; title?: string; eyebrow?: string }) {
  const kennel = await getCurrentKennel()
  const posts = await getPublishedPosts(kennel.id, limit)
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(title || eyebrow) && (
          <div className="mb-8">
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{eyebrow}</p>
            )}
            {title && <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{title}</h2>}
          </div>
        )}
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline bg-canvas p-12 text-center">
            <p className="text-sm text-muted">Aún no hay artículos publicados. Vuelve pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(p => (
              <Link key={p.slug} href={`./blog/${p.slug}`} className="block group">
                <article className="rounded-xl border border-hairline bg-canvas overflow-hidden hover:border-ink/30 hover:shadow-sm transition h-full flex flex-col">
                  {p.cover_image_url && (
                    <div className="aspect-[16/9] bg-surface-card overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.cover_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    {p.category_slug && (
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{p.category_slug}</p>
                    )}
                    <h3 className="text-base font-bold text-ink mb-2 tracking-tight">{p.title}</h3>
                    {p.excerpt && <p className="text-sm text-body leading-relaxed mb-3 line-clamp-3">{p.excerpt}</p>}
                    <p className="text-[11px] text-muted mt-auto">
                      {fmtDate(p.published_at)}
                      {p.reading_time_minutes ? ` · ${p.reading_time_minutes} min` : ''}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
