import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PagesListClient from '@/components/web/pages-list-client'

export const metadata = { title: 'Web pública · Genealogic Pro' }

export default async function WebPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels').select('id, name, slug, custom_domain').eq('owner_id', user.id).limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Web pública</h1>
        <p className="text-body">Necesitas un criadero registrado.</p>
      </div>
    )
  }

  const { data: pages } = await supabase
    .from('kennel_pages')
    .select('id, slug, title, page_type, content_md, is_published, position, show_in_nav, cover_image_url, updated_at')
    .eq('kennel_id', kennel.id)
    .order('position')

  return (
    <PagesListClient
      kennelId={kennel.id}
      kennelName={kennel.name}
      kennelSlug={kennel.slug}
      customDomain={(kennel as any).custom_domain || null}
      initialPages={pages || []}
    />
  )
}
