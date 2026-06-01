import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PostEditor from '@/components/kennel/post-editor'
import { ArrowLeft } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export default async function KennelBlogNewPage() {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!kennel) redirect('/kennel/new')

  return (
    <div className="space-y-4">
      <Link
        href="/kennel/contenido/blog"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-ink transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t('Volver al blog')}
      </Link>
      <div>
        <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">{t('Nuevo post')}</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          {t('Guarda como borrador mientras lo escribes. Publica cuando esté listo.')}
        </p>
      </div>
      <PostEditor kennelId={kennel.id} initialPost={null} />
    </div>
  )
}
