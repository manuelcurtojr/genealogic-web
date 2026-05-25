/**
 * /newsletter/suscriptores — gestión dedicada de la lista del newsletter.
 * Reusa el SubscribersPageClient que ya teníamos en /newsletter pre-refactor.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SubscribersPageClient from '@/components/newsletter/subscribers-page-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Suscriptores · Newsletter · Genealogic' }

export default async function SuscriptoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels').select('id, name').eq('owner_id', user.id).maybeSingle()
  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Suscriptores</h1>
        <p className="text-body">Necesitas un criadero registrado.</p>
      </div>
    )
  }

  const { data: subscribers } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, full_name, source, tags, is_active, subscribed_at, unsubscribed_at')
    .eq('kennel_id', kennel.id)
    .order('subscribed_at', { ascending: false })

  return (
    <div>
      <Link
        href="/newsletter"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a campañas
      </Link>
      <SubscribersPageClient
        kennelId={kennel.id}
        kennelName={kennel.name}
        initialSubscribers={subscribers || []}
      />
    </div>
  )
}
