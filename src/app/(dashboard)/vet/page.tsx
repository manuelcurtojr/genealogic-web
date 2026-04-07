import { createClient } from '@/lib/supabase/server'
import VetRemindersClient from '@/components/vet/vet-reminders-client'

export default async function VetRemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all reminders with dog info
  const { data: reminders } = await supabase
    .from('vet_reminders')
    .select('*, dog:dogs(id, name, sex, thumbnail_url, breed:breeds(name))')
    .eq('owner_id', user.id)
    .order('due_date', { ascending: true })

  // Fetch dogs for the "add reminder" form
  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, birth_date')
    .eq('owner_id', user.id)
    .order('name')

  // Fetch templates
  const { data: templates } = await supabase
    .from('vet_reminder_templates')
    .select('*')
    .or(`is_system.eq.true,owner_id.eq.${user.id}`)
    .order('type, name')

  return (
    <VetRemindersClient
      initialReminders={reminders || []}
      dogs={dogs || []}
      templates={templates || []}
      userId={user.id}
    />
  )
}
