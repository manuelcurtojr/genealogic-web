import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan } from '@/lib/kennel/pro-web'
import { ProPageShell } from '@/components/kennel/pro-page-shell'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function KennelBlogPostPage({
  params,
}: { params: Promise<{ id: string; postSlug: string }> }) {
  const { id, postSlug } = await params
  const supabase = await createClient()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, owner_id, name')
    .eq(field, id)
    .single()
  if (!kennel) notFound()
  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}/blog/${postSlug}`)
  }

  let ownerPlan: string | null = null
  if (kennel.owner_id) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', kennel.owner_id).single()
    ownerPlan = profile?.plan || null
  }
  const isPro = isKennelOnProPlan({ ownerPlan, ownerUserId: kennel.owner_id })
  if (!isPro) redirect(`/kennels/${kennel.slug || kennel.id}`)

  const { data: post } = await supabase
    .from('kennel_posts')
    .select('id, slug, title, excerpt, cover_image_url, cover_image_alt, published_at, reading_time_minutes, category_slug, body, body_text, author_name')
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
          <img src={post.cover_image_url} alt={post.cover_image_alt || ''} className="h-full w-full object-cover" />
        </div>
      )}

      {post.excerpt && (
        <p className="text-[16px] sm:text-[18px] text-body leading-[1.55] max-w-prose font-medium">{post.excerpt}</p>
      )}

      {/* body es {html: "<...>"} si el post se redactó con HTML estructurado
          (lo normal hoy). Si no hay HTML, fallback al body_text como texto
          plano para no romper posts antiguos.
          Los estilos prose-* dan H2/H3/UL/HR semánticos sin necesidad de
          tocar el HTML guardado. */}
      {(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const html = (post.body as any)?.html as string | undefined
        if (html && html.trim()) {
          return (
            <article
              className="prose prose-sm sm:prose-base max-w-none text-body leading-[1.7] text-[15px] sm:text-[16px] prose-headings:tracking-[-0.02em] prose-headings:text-ink prose-h2:mt-10 prose-h2:mb-3 prose-h3:mt-6 prose-h3:mb-2 prose-p:my-3 prose-li:my-1 prose-strong:text-ink prose-a:text-ink hover:prose-a:text-[#FE6620] prose-hr:my-10"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        }
        if (post.body_text) {
          return (
            <article className="prose prose-sm sm:prose max-w-none text-body whitespace-pre-line leading-[1.7] text-[15px] sm:text-[16px]">
              {post.body_text}
            </article>
          )
        }
        return null
      })()}
    </ProPageShell>
  )
}
