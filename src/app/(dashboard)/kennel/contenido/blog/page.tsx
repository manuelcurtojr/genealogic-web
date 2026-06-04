import Link from 'next/link'
import { Img } from '@/components/ui/img'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, BookOpen, Pencil } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export default async function KennelBlogListPage() {
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

  const { data: posts } = await supabase
    .from('kennel_posts')
    .select('id, slug, title, excerpt, status, published_at, updated_at, cover_image_url, reading_time_minutes')
    .eq('kennel_id', kennel.id)
    .order('updated_at', { ascending: false })
    .limit(100)

  const list = posts || []
  const published = list.filter(p => p.status === 'published').length

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">Blog</h2>
          <p className="mt-1 text-[12.5px] text-muted max-w-prose">
            {t('Posts del criadero. Mínimo 1 publicado para que la página de blog sea pública.')}{' '}
            {t('Total:')} {list.length} {list.length === 1 ? 'post' : 'posts'} · {published} {t('publicados')}.
          </p>
        </div>
        <Link
          href="/kennel/contenido/blog/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-on-primary hover:opacity-90 transition self-start"
        >
          <Plus className="h-3.5 w-3.5" /> {t('Nuevo post')}
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-10 text-center">
          <BookOpen className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-3 text-[14px] font-semibold text-ink">{t('Aún no tienes posts')}</p>
          <p className="mt-1 text-[12.5px] text-body max-w-sm mx-auto leading-snug">
            {t('Crea tu primer post: nueva camada disponible, lección aprendida, novedad sobre la raza...')}
          </p>
          <Link
            href="/kennel/contenido/blog/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-on-primary hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> {t('Crear primer post')}
          </Link>
        </div>
      ) : (
        <ul className="rounded-2xl border border-hairline divide-y divide-hairline bg-canvas">
          {list.map(post => {
            const date = post.published_at || post.updated_at
            const dateLabel = date
              ? new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'
            return (
              <li key={post.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                <div className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-card">
                  {post.cover_image_url ? (
                    <Img w={680} src={post.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-ink truncate">{post.title}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        post.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {post.status === 'published' ? t('Publicado') : t('Borrador')}
                    </span>
                  </div>
                  {post.excerpt && (
                    <p className="mt-0.5 text-[12.5px] text-body line-clamp-1">{post.excerpt}</p>
                  )}
                  <p className="mt-1 text-[11px] text-muted">
                    {dateLabel}
                    {post.reading_time_minutes ? ` · ${post.reading_time_minutes} ${t('min lectura')}` : ''}
                  </p>
                </div>
                <Link
                  href={`/kennel/contenido/blog/${post.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-medium text-body hover:border-ink/30 hover:text-ink transition flex-shrink-0"
                >
                  <Pencil className="h-3 w-3" /> {t('Editar')}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
