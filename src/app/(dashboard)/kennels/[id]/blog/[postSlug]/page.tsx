import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadProPage } from '@/lib/kennel/pro-page-loader'
import { ProPageShell } from '@/components/kennel/pro-page-shell'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function KennelBlogPostPage({ params }: { params: Promise<{ id: string; postSlug: string }> }) {
  const { id, postSlug } = await params
  // El blog index ya pasó por loadProPage('blog'). Aquí el post individual
  // solo necesita gate Pro + el post mismo (status=published).
  const { kennel } = await loadProPage({ kennelId: id, pageId: null })

  const supabase = await createClient()
  const { data: post } = await supabase
    .from('kennel_posts')
    .select('id, slug, title, excerpt, cover_image_url, cover_image_alt, published_at, reading_time_minutes, category_slug, body_text, author_name')
    .eq('kennel_id', kennel.id)
    .eq('slug', postSlug)
    .eq('status', 'published')
    .single()
  if (!post) notFound()

  const date = post.published_at ? new Date(post.published_at) : null

  return (
    <ProPageShell eyebrow={post.category_slug?.replace(/-/g, ' ') || 'Blog'} title={post.title}>
      <Link
        href={`/kennels/${kennel.slug}/blog`}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-ink transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver al blog
      </Link>

      <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted">
        {date && <span>{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
        {post.author_name && <span>· por {post.author_name}</span>}
        {post.reading_time_minutes && <span>· {post.reading_time_minutes} min lectura</span>}
      </div>

      {post.cover_image_url && (
        <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-hairline bg-surface-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image_url}
            alt={post.cover_image_alt || ''}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {post.excerpt && (
        <p className="text-[16px] sm:text-[18px] text-body leading-[1.55] max-w-prose font-medium">
          {post.excerpt}
        </p>
      )}

      {post.body_text && (
        <article className="prose prose-sm sm:prose max-w-none text-body whitespace-pre-line leading-[1.7] text-[15px] sm:text-[16px]">
          {post.body_text}
        </article>
      )}
    </ProPageShell>
  )
}
