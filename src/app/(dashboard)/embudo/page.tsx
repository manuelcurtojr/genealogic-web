import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ensureDefaultPipelines, getKennelPipelines } from '@/lib/pipelines/queries'
import { getKennelBreedNames } from '@/lib/kennel/breeds'
import FunnelBoard from '@/components/embudo/funnel-board'
import EmbudoTeaser from '@/components/embudo/embudo-teaser'
import { hasPaidPlan, isEnterpriseUser } from '@/lib/permissions'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Embudo · Genealogic' }

/**
 * /embudo — el embudo de ventas y reservas (antes "Reservas").
 * Pipelines configurables con pasos tipados (normal/ganado/perdido), listas
 * por paso (no kanban de arrastrar), celebración en pasos ganados, encuesta
 * de motivo en pasos perdidos y distintivo de solicitud nueva.
 */
export default async function EmbudoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]
  const t = getTranslator(await getLocale())

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">{t('Embudo')}</h1>
        <p className="text-body">
          {t('Para gestionar solicitudes necesitas un criadero registrado. Crea tu kennel desde Mi Criadero.')}
        </p>
      </div>
    )
  }

  // El embudo de ventas es Pro. El FREE ve un TEASER: el número REAL de
  // solicitudes que le han llegado (el upsell duele porque hay clientes
  // esperando) pero SIN cargar los datos del solicitante al navegador.
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle()
  const isPro = hasPaidPlan(profile?.plan) || isEnterpriseUser(user.id)
  if (!isPro) {
    const { count } = await supabase
      .from('puppy_reservations')
      .select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id)
    return <EmbudoTeaser count={count || 0} />
  }

  // Siembra lazy de los pipelines por defecto (service role) + carga (RLS owner)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  await ensureDefaultPipelines(admin, kennel.id)
  const pipelines = await getKennelPipelines(supabase, kennel.id)

  const { data: entries } = await supabase
    .from('puppy_reservations')
    .select(
      'id, applicant_name, applicant_email, applicant_phone, applicant_message, preference_sex, preference_color, deposit_amount_cents, total_price_cents, currency, created_at, status, pipeline_id, stage_id, seen_by_breeder_at, lost_reason, client_user_id, origin_entry_id, applicant_purpose, applicant_country, applicant_city, applicant_address, applicant_postal_code, applicant_extra_data, source, internal_note',
    )
    .eq('kennel_id', kennel.id)
    .order('created_at', { ascending: false })
    .limit(1000)

  // Cobrado real por reserva (suma de pagos PAGADOS). Es la fuente de verdad
  // para las métricas de dinero del embudo (el chip "Pagado" de la tarjeta usa
  // deposit_amount_cents, pero aquí queremos lo efectivamente cobrado).
  const { data: pays } = await admin
    .from('reservation_payments')
    .select('reservation_id, amount_cents')
    .eq('kennel_id', kennel.id)
    .eq('status', 'paid')
  const paidByEntry: Record<string, number> = {}
  for (const p of pays || []) {
    paidByEntry[p.reservation_id] = (paidByEntry[p.reservation_id] || 0) + (p.amount_cents || 0)
  }

  // Razas del criadero → pueblan el selector de "raza de interés" del panel.
  const kennelBreeds = await getKennelBreedNames(supabase, kennel.id)

  return (
    <FunnelBoard
      kennelName={kennel.name}
      pipelines={pipelines}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entries={(entries || []) as any}
      paidByEntry={paidByEntry}
      kennelBreeds={kennelBreeds}
    />
  )
}
