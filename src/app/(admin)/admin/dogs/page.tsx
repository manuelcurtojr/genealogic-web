import { createClient } from '@/lib/supabase/server'
import AdminDogsClient from '@/components/admin/admin-dogs-client'

export default async function AdminDogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: breeds } = await supabase.from('breeds').select('id, name').order('name')
  const { data: kennels } = await supabase.from('kennels').select('id, name').order('name')

  return <AdminDogsClient userId={user.id} breeds={breeds || []} kennels={kennels || []} />
}
