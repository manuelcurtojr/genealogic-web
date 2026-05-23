import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReservationsPipeline from '@/components/reservas/reservations-pipeline'
import { hasProAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Solicitudes · Genealogic' }

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
        <h1 className="text-3xl font-bold text-ink mb-3">Solicitudes</h1>
        <p className="text-body">
          Para gestionar solicitudes necesitas un criadero registrado.
          Crea tu kennel desde Mi Criadero.
        </p>
      </div>
    )
  }

  const { data: reservations } = await supabase
    .from('puppy_reservations')
    .select(`
      id, status, source, created_at,
      applicant_name, applicant_email, applicant_phone, applicant_message,
      preference_sex, preference_color
    `)
    .eq('kennel_id', kennel.id)
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <ReservationsPipeline
      kennelId={kennel.id}
      kennelName={kennel.name}
      reservations={(reservations || []) as any}
      isPro={isPro}
    />
  )
}
