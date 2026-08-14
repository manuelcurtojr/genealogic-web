import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { canUseMeasurements } from '@/lib/permissions'
import DogCompare from '@/components/planner/dog-compare'

// Comparador de ejemplares — beta exclusiva (canUseMeasurements, hoy solo Irema).
// Gate REAL server-side: quien no la tenga habilitada recibe 404 (ni existe por URL).
export const dynamic = 'force-dynamic'

export default async function CompararPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!canUseMeasurements(user.id)) notFound()

  return <DogCompare userId={user.id} />
}
