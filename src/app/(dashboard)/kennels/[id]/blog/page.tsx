import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan, isExtraPageEnabled } from '@/lib/kennel/pro-web'
import { pageNotYetPublicMessage } from '@/lib/kennel/pro-page-loader'
import { ProPageShell, OwnerDraftBanner, EmptyContentState } from '@/components/kennel/pro-page-shell'
import { BookOpen } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('name, slug, city, country')
    .eq(field, id)
    .maybeSingle()
  if (!kennel) return { title: 'No encontrado' }
  const loc = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const title = `Blog · ${kennel.name}`
  const description = `Notas, novedades y aprendizajes de ${kennel.name}${loc ? ` en ${loc}` : ''}. Camadas anunciadas y todo lo que merece la pena contar.`
  const canonical = `https://genealogic.io/kennels/${kennel.slug}/blog`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', locale: 'es_ES' },
  }
}

export default async function KennelBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, owner_id, name, enabled_pages')
    .eq(field, id)
    .single()
  if (!kennel) notFound()
  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}/blog`)
  }

  let ownerPlan: string | null = null
  if (kennel.owner_id) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', kennel.owner_id).single()
    ownerPlan = profile?.plan || null
  }
  const isPro = isKennelOnProPlan({ ownerPlan, ownerUserId: kennel.owner_id })
  if (!isPro) redirect(`/kennels/${kennel.slug || kennel.id}`)

  const isOwner = user?.id === kennel.owner_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enabled = isExtraPageEnabled(kennel.enabled_pages as any, 'blog')

  const { data: posts } = await supabase
    .from('kennel_posts')
    .select('id, slug, title, excerpt, cover_image_url, published_at, reading_time_minutes, category_slug')
    .eq('kennel_id', kennel.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30)

  const list = posts || []
  const hasContent = list.length >= 1

  if (!isOwner && (!enabled || !hasContent)) notFound()

  return (
    <ProPageShell
      eyebrow="Notas y noticias"
      title="Desde el criadero"
      description="Camadas anunciadas, lecciones aprendidas, novedades y todo lo que merece la pena contar."
    >
      {isOwner && (!enabled || !hasContent) && (
        <OwnerDraftBanner
          message={!enabled
            ? 'Activa la página "Blog" desde Mi criadero para que sea pública.'
            : pageNotYetPublicMessage('blog')}
          ctaHref="/kennel/contenido/blog"
          ctaLabel="Crear post"
        />
      )}

      {list.length === 0 ? (
        isOwner ? (
          <EmptyContentState
            title="Aún no hay posts publicados"
            description="Publica al menos 1 post para que esta sección se haga pública."
          />
        ) : (
          <EmptyContentState
            title="Próximamente"
            description={`${kennel.name} publicará posts en breve.`}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {list.map(post => {
            const date = post.published_at ? new Date(post.published_at) : null
            return (
              <Link
                key={post.id}
                href={`/kennels/${kennel.slug}/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas hover:border-ink/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition"
              >
                <div className="relative aspect-[16/10] bg-surface-card overflow-hidden">
                  {post.cover_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={post.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  {post.category_slug && (
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted mb-1.5">
                      {post.category_slug.replace(/-/g, ' ')}
                    </p>
                  )}
                  <h3 className="text-[15.5px] font-semibold text-ink leading-snug tracking-[-0.01em]">{post.title}</h3>
                  {post.excerpt && (
                    <p className="mt-1.5 text-[13px] text-body line-clamp-2 leading-[1.55]">{post.excerpt}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-hairline flex items-center gap-2 text-[11.5px] text-muted">
                    {date && <span>{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    {post.reading_time_minutes && (
                      <>
                        <span>·</span>
                        <span>{post.reading_time_minutes} min lectura</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </ProPageShell>
  )
}
