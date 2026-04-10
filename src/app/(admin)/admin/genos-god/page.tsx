import { createClient } from '@/lib/supabase/server'
import GenosGodClient from '@/components/admin/genos-god-client'

export default async function GenosGodPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="-m-6 lg:-m-8">
      <GenosGodClient userId={user.id} />
    </div>
  )
}
