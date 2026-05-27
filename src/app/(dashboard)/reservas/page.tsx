import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReservationsPipeline from '@/components/reservas/reservations-pipeline'
import { hasProAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reservas · Genealogic' }

/**
 * /reservas refactorizado al modelo Pawdoq Breeders:
 * - Free: bandeja simple de Solicitudes (entradas vía formulario público)
 * - Pro: 2 pipelines (Ventas / Clientes) con tabs por estado, panel
 *   detalle y futuros gating de bot + acciones avanzadas
 */
export default async function ReservasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [kennelArr, profileRes] = await Promise.all([
    supabase.from('kennels').select('id, name').eq('owner_id', user.id).limit(1),
    supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
  ])
  const kennel = kennelArr.data?.[0]
  const isPro = hasProAccess(profileRes.data?.plan)

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Reservas</h1>
        <p className="text-body">
          Para gestionar solicitudes necesitas un criadero registrado.
          Crea tu kennel desde Mi Criadero.
        </p>
      </div>
    )
  }

  const [reservationsRes, dogsRes] = await Promise.all([
    supabase.from('puppy_reservations')
      .select('*')
      .eq('kennel_id', kennel.id)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('dogs')
      .select('id, name, sex, thumbnail_url')
      .eq('kennel_id', kennel.id)
      .order('name'),
  ])

  return (
    <ReservationsPipeline
      kennelId={kennel.id}
      kennelName={kennel.name}
      reservations={(reservationsRes.data || []) as any}
      dogs={(dogsRes.data || []) as any}
      isPro={isPro}
    />
  )
}
