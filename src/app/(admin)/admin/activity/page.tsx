import { createClient } from '@/lib/supabase/server'
import AdminActivityClient from '@/components/admin/admin-activity-client'

export default async function AdminActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="-m-6 lg:-m-8">
      <AdminActivityClient />
    </div>
  )
}
