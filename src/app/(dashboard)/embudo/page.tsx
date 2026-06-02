import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ensureDefaultPipelines, getKennelPipelines } from '@/lib/pipelines/queries'
import FunnelBoard from '@/components/embudo/funnel-board'
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

  // Siembra lazy de los pipelines por defecto (service role) + carga (RLS owner)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  await ensureDefaultPipelines(admin, kennel.id)
  const pipelines = await getKennelPipelines(supabase, kennel.id)

  const { data: entries } = await supabase
    .from('puppy_reservations')
    .select(
      'id, applicant_name, applicant_email, applicant_phone, applicant_message, preference_sex, created_at, status, pipeline_id, stage_id, seen_by_breeder_at, lost_reason, client_user_id, origin_entry_id, applicant_purpose, applicant_country, applicant_city, applicant_address, applicant_postal_code, applicant_extra_data, source',
    )
    .eq('kennel_id', kennel.id)
    .order('created_at', { ascending: false })
    .limit(1000)

  return (
    <FunnelBoard
      kennelName={kennel.name}
      pipelines={pipelines}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entries={(entries || []) as any}
    />
  )
}
