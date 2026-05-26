import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FAQEditor from '@/components/kennel/faq-editor'

export const dynamic = 'force-dynamic'

export default async function KennelFAQEditorPage() {
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

  // Todas las entries activas. La biblioteca de conocimiento se comparte
  // entre la home Pro y el Emailbot — lo que escribes aquí también entrena
  // al bot. Más simple para el criador y semánticamente correcto.
  const { data: entries } = await supabase
    .from('knowledge_entries')
    .select('id, title, content')
    .eq('kennel_id', kennel.id)
    .eq('is_active', true)
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  return <FAQEditor kennelId={kennel.id} initialEntries={entries || []} />
}
