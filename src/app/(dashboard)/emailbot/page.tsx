import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmailbotConfigClient from '@/components/emailbot/emailbot-config-client'

export const metadata = { title: 'Emailbot · Genealogic Pro' }

export default async function EmailbotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name, slug')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Emailbot</h1>
        <p className="text-body">Necesitas un criadero registrado.</p>
      </div>
    )
  }

  const [cfgRes, knowledgeRes, threadsRes, threads30dRes, escalated30dRes] = await Promise.all([
    supabase.from('emailbot_config').select('*').eq('kennel_id', kennel.id).maybeSingle(),
    supabase.from('knowledge_entries').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).eq('is_active', true),
    supabase.from('emailbot_threads').select('id', { count: 'exact', head: true }).eq('kennel_id', kennel.id),
    supabase.from('emailbot_threads').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id)
      .gte('last_message_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase.from('emailbot_threads').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).eq('status', 'derived_to_human'),
  ])

  return (
    <EmailbotConfigClient
      kennelId={kennel.id}
      kennelName={kennel.name}
      kennelSlug={kennel.slug}
      initialConfig={cfgRes.data || null}
      stats={{
        knowledgeCount: knowledgeRes.count || 0,
        threadsTotal: threadsRes.count || 0,
        threads30d: threads30dRes.count || 0,
        escalated: escalated30dRes.count || 0,
      }}
    />
  )
}
