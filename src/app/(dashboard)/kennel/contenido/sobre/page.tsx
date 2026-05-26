import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AboutEditor from '@/components/kennel/about-editor'

export default async function KennelSobreEditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, about_md')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!kennel) redirect('/kennel/new')

  return <AboutEditor kennelId={kennel.id} initialAboutMd={kennel.about_md} />
}
