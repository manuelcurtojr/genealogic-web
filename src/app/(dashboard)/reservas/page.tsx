import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReservationsBoard from '@/components/reservas/reservations-board'

export const metadata = { title: 'Reservas · Genealogic Pro' }

export default async function ReservasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener el kennel del usuario
  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Reservas</h1>
        <p className="text-body">
          Para usar el pipeline de reservas necesitas un criadero registrado.
          Crea tu kennel desde Mi Criadero.
        </p>
      </div>
    )
  }

  // Cargar reservas, owners y litters del kennel
  const [reservationsRes, ownersRes, littersRes, dogsRes] = await Promise.all([
    supabase
      .from('puppy_reservations')
      .select('id, status, owner_id, litter_id, dog_id, preference_sex, preference_color, preference_notes, deposit_amount_cents, total_price_cents, currency, position_in_queue, created_at, updated_at')
      .eq('kennel_id', kennel.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('owners')
      .select('id, full_name, email, phone')
      .eq('kennel_id', kennel.id)
      .order('full_name'),
    supabase
      .from('litters')
      .select('id, expected_date, father_id, mother_id')
      .eq('owner_id', user.id)
      .order('expected_date', { ascending: false })
      .limit(20),
    supabase
      .from('dogs')
      .select('id, name, sex')
      .eq('kennel_id', kennel.id)
      .order('name')
      .limit(100),
  ])

  return (
    <ReservationsBoard
      kennelId={kennel.id}
      kennelName={kennel.name}
      initialReservations={reservationsRes.data || []}
      owners={ownersRes.data || []}
      litters={littersRes.data || []}
      dogs={dogsRes.data || []}
    />
  )
}
