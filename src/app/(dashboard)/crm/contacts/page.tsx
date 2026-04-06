import { createClient } from '@/lib/supabase/server'
import ContactsPageClient from '@/components/crm/contacts-page-client'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [contactsRes, dealsRes] = await Promise.all([
    supabase.from('contacts').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('deals').select('id, title, value, currency, contact_id').eq('owner_id', user.id),
  ])

  return (
    <ContactsPageClient
      initialContacts={contactsRes.data || []}
      initialDeals={dealsRes.data || []}
      userId={user.id}
    />
  )
}
