import { createClient } from '@/lib/supabase/server'
import AdminUsersClient from '@/components/admin/admin-users-client'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, display_name, email, role, created_at, country, city, avatar_url')
    .order('created_at', { ascending: false })

  return <AdminUsersClient initialUsers={users || []} />
}
