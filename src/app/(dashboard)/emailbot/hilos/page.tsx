import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ThreadsListClient from '@/components/emailbot/threads-list-client'
import EmailbotSubnav from '@/components/emailbot/emailbot-subnav'

export const metadata = { title: 'Hilos · Genealogic Pro' }

export default async function EmailbotHilosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels').select('id, name').eq('owner_id', user.id).limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Hilos</h1>
        <p className="text-body">Necesitas un criadero registrado.</p>
      </div>
    )
  }

  const { data: threads } = await supabase
    .from('emailbot_threads')
    .select('id, contact_email, contact_name, subject, status, bot_replies_count, last_message_at, created_at')
    .eq('kennel_id', kennel.id)
    .order('last_message_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-5">
      <EmailbotSubnav />
      <ThreadsListClient
        kennelName={kennel.name}
        initialThreads={threads || []}
      />
    </div>
  )
}
