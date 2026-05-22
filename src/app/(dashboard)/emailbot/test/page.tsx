import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatPlayground from '@/components/emailbot/chat-playground'

export const metadata = { title: 'Test Emailbot · Genealogic Pro' }

export default async function EmailbotTestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name, description')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Test del Emailbot</h1>
        <p className="text-body">Necesitas un criadero registrado.</p>
      </div>
    )
  }

  // Contar entradas activas de Biblioteca
  const { count: knowledgeCount } = await supabase
    .from('knowledge_entries')
    .select('id', { count: 'exact', head: true })
    .eq('kennel_id', kennel.id)
    .eq('is_active', true)

  return (
    <ChatPlayground
      kennelId={kennel.id}
      kennelName={kennel.name}
      knowledgeCount={knowledgeCount || 0}
    />
  )
}
