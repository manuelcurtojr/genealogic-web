import { createClient } from '@/lib/supabase/server'
import AdminVetTemplatesClient from '@/components/admin/admin-vet-templates-client'

export default async function AdminVetTemplatesPage() {
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('vet_reminder_templates')
    .select('*')
    .eq('is_system', true)
    .order('type, name')

  return <AdminVetTemplatesClient templates={templates || []} />
}
