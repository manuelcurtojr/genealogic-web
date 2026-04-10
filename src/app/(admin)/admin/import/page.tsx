import { createClient } from '@/lib/supabase/server'
import AdminImportClient from '@/components/admin/admin-import-client'

export default async function AdminImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="-m-6 lg:-m-8">
      <AdminImportClient userId={user.id} />
    </div>
  )
}
