import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KnowledgePageClient from '@/components/conocimiento/knowledge-page-client'

export const metadata = { title: 'Biblioteca · Genealogic Pro' }

export default async function ConocimientoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Biblioteca</h1>
        <p className="text-body">
          Para usar la Biblioteca necesitas un criadero registrado. Crea tu
          kennel desde Mi Criadero.
        </p>
      </div>
    )
  }

  const { data: entries } = await supabase
    .from('knowledge_entries')
    .select('id, category, title, content, position, is_active, updated_at')
    .eq('kennel_id', kennel.id)
    .order('category')
    .order('position')

  return (
    <KnowledgePageClient
      kennelId={kennel.id}
      kennelName={kennel.name}
      initialEntries={entries || []}
    />
  )
}
