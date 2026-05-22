import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { renderMarkdown } from '@/lib/markdown'
import PublicHeader from '@/components/layout/public-header'
import PageTracker from '@/components/track/page-tracker'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string; page: string }> }): Promise<Metadata> {
  const { slug, page } = await params
  const supabase = await createClient()
  const { data: row } = await supabase
    .from('kennel_pages')
    .select('title, meta_description, cover_image_url, kennel:kennels!inner(name, slug)')
    .eq('slug', page)
    .eq('is_published', true)
    .filter('kennel.slug', 'eq', slug)
    .single()

  if (!row) return { title: 'Página no encontrada — Genealogic' }
  const kennelName = (Array.isArray(row.kennel) ? row.kennel[0]?.name : (row.kennel as any)?.name) || ''
  const description = row.meta_description || `${row.title} — ${kennelName}`
  return {
    title: `${row.title} · ${kennelName}`,
    description,
    openGraph: {
      title: row.title, description, type: 'website',
      siteName: kennelName,
      ...(row.cover_image_url ? { images: [{ url: row.cover_image_url }] } : {}),
    },
  }
}

export default async function PublicKennelPage({ params }: { params: Promise<{ slug: string; page: string }> }) {
  const { slug, page } = await params
  const supabase = await createClient()

  // Cargar kennel + página + nav de páginas publicadas
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, name, slug, logo_url, description, city, country')
    .eq('slug', slug)
    .single()
  if (!kennel) notFound()

  const { data: pageRow } = await supabase
    .from('kennel_pages')
    .select('id, slug, title, content_md, cover_image_url, is_published, meta_description')
    .eq('kennel_id', kennel.id)
    .eq('slug', page)
    .eq('is_published', true)
    .single()
  if (!pageRow) notFound()

  const { data: navPages } = await supabase
    .from('kennel_pages')
    .select('slug, title')
    .eq('kennel_id', kennel.id)
    .eq('is_published', true)
    .eq('show_in_nav', true)
    .order('position')

  const html = renderMarkdown(pageRow.content_md || '')

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PublicHeader />
      <PageTracker kennelId={kennel.id} />

      {/* Kennel mini-nav */}
      <div className="border-b border-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
          <Link href={`/kennels/${kennel.slug}`} className="text-sm font-bold text-ink truncate">
            {kennel.name}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-body ml-auto overflow-x-auto">
            {(navPages || []).map(p => (
              <Link
                key={p.slug}
                href={`/c/${kennel.slug}/${p.slug}`}
                className={`whitespace-nowrap hover:text-ink transition ${p.slug === pageRow.slug ? 'text-ink font-semibold' : ''}`}
              >
                {p.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Cover */}
      {pageRow.cover_image_url && (
        <div className="relative w-full aspect-[21/9] bg-surface-card overflow-hidden">
          <img src={pageRow.cover_image_url} alt={pageRow.title}
            className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-ink tracking-tight mb-8">{pageRow.title}</h1>
        <div className="prose-content" dangerouslySetInnerHTML={{ __html: html }} />
      </article>

      {/* Footer */}
      <footer className="border-t border-hairline py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-muted">
          <p>
            {kennel.name}
            {(kennel.city || kennel.country) && ` · ${[kennel.city, kennel.country].filter(Boolean).join(', ')}`}
          </p>
          <p className="mt-1">
            Sitio creado con <Link href="/" className="hover:text-ink underline">Genealogic</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
