import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PostEditor from '@/components/kennel/post-editor'
import { ArrowLeft } from 'lucide-react'

export default async function KennelBlogNewPage() {
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
        <ArrowLeft className="h-3.5 w-3.5" /> Volver al blog
      </Link>
      <div>
        <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">Nuevo post</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Guarda como borrador mientras lo escribes. Publica cuando esté listo.
        </p>
      </div>
      <PostEditor kennelId={kennel.id} initialPost={null} />
    </div>
  )
}
