import { createClient } from '@/lib/supabase/server'
import AdminSettingsClient from '@/components/admin/admin-settings-client'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('id, key, value, description, updated_at')
    .order('key')

  return <AdminSettingsClient settings={settings || []} />
}
