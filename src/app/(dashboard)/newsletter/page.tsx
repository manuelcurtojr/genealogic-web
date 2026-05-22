import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscribersPageClient from '@/components/newsletter/subscribers-page-client'

export const metadata = { title: 'Newsletter · Genealogic Pro' }

export default async function NewsletterPage() {
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
        <h1 className="text-3xl font-bold text-ink mb-3">Newsletter</h1>
        <p className="text-body">Necesitas un criadero registrado para gestionar suscriptores.</p>
      </div>
    )
  }

  const { data: subscribers } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, full_name, source, tags, is_active, subscribed_at, unsubscribed_at')
    .eq('kennel_id', kennel.id)
    .order('subscribed_at', { ascending: false })

  return (
    <SubscribersPageClient
      kennelId={kennel.id}
      kennelName={kennel.name}
      initialSubscribers={subscribers || []}
    />
  )
}
