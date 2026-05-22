import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientesPageClient from '@/components/clientes/clientes-page-client'

export const metadata = { title: 'Clientes · Genealogic Pro' }

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Clientes</h1>
        <p className="text-body">
          Para gestionar clientes necesitas un criadero registrado. Crea tu
          kennel desde Mi Criadero.
        </p>
      </div>
    )
  }

  const { data: owners } = await supabase
    .from('owners')
    .select('id, full_name, email, phone, city, country, created_at, updated_at')
    .eq('kennel_id', kennel.id)
    .order('full_name')

  // Conteo de reservas por owner
  const { data: reservations } = await supabase
    .from('puppy_reservations')
    .select('owner_id, status')
    .eq('kennel_id', kennel.id)

  const reservationsByOwner: Record<string, { total: number; active: number }> = {}
  for (const r of reservations || []) {
    if (!r.owner_id) continue
    if (!reservationsByOwner[r.owner_id]) reservationsByOwner[r.owner_id] = { total: 0, active: 0 }
    reservationsByOwner[r.owner_id].total++
    if (r.status !== 'delivered' && r.status !== 'cancelled') {
      reservationsByOwner[r.owner_id].active++
    }
  }

  return (
    <ClientesPageClient
      kennelId={kennel.id}
      kennelName={kennel.name}
      initialOwners={owners || []}
      reservationsByOwner={reservationsByOwner}
    />
  )
}
