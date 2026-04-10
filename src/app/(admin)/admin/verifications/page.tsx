import { createClient } from '@/lib/supabase/server'
import AdminVerificationsClient from '@/components/admin/admin-verifications-client'

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="-m-6 lg:-m-8">
      <AdminVerificationsClient userId={user.id} />
    </div>
  )
}
