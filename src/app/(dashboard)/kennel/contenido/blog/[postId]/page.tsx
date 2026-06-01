import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PostEditor from '@/components/kennel/post-editor'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export default async function KennelBlogEditPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!kennel) redirect('/kennel/new')

  const { data: post } = await supabase
    .from('kennel_posts')
    .select('id, slug, title, excerpt, body_text, cover_image_url, status, published_at')
    .eq('id', postId)
    .eq('kennel_id', kennel.id)
    .single()
  if (!post) notFound()

  const publicUrl = post.status === 'published' && kennel.slug
    ? `/kennels/${kennel.slug}/blog/${post.slug}`
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/kennel/contenido/blog"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-ink transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t('Volver al blog')}
        </Link>
        {publicUrl && (
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12.5px] font-medium text-body hover:border-ink/30 hover:text-ink transition"
          >
            <ExternalLink className="h-3.5 w-3.5" /> {t('Ver post público')}
          </Link>
        )}
      </div>
      <div>
        <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">{t('Editar post')}</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          {t('Estado actual:')} <span className={`font-semibold ${post.status === 'published' ? 'text-emerald-700' : 'text-amber-700'}`}>
            {post.status === 'published' ? t('Publicado') : t('Borrador')}
          </span>
        </p>
      </div>
      <PostEditor
        kennelId={kennel.id}
        initialPost={{
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          body_text: post.body_text,
          cover_image_url: post.cover_image_url,
          status: post.status,
        }}
      />
    </div>
  )
}
