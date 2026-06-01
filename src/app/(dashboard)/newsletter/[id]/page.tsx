/**
 * /newsletter/[id] — editor de una campaña.
 *
 * Server component que carga la campaña + audiencias y pasa al editor cliente.
 * Si la campaña está en estado 'sent', el editor pasa a modo solo-lectura
 * con stats finales.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { countAllAudiences } from '@/lib/newsletter/audiences'
import CampaignEditor, {
  type CampaignRow,
  type AudienceCounts,
} from '@/components/newsletter/campaign-editor'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Editor campaña · Newsletter · Genealogic' }

export default async function CampaignPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels').select('id, name').eq('owner_id', user.id).maybeSingle()
  if (!kennel) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: campaignRaw } = await admin
    .from('newsletter_campaigns').select('*')
    .eq('id', id)
    .eq('kennel_id', kennel.id)
    .maybeSingle()
  if (!campaignRaw) notFound()

  const audiences: AudienceCounts = await countAllAudiences(kennel.id)
  const campaign = campaignRaw as CampaignRow

  return (
    <div className="space-y-5 max-w-5xl">
      <Link
        href="/newsletter"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t('Volver a newsletter')}
      </Link>
      <CampaignEditor
        kennelId={kennel.id}
        kennelName={kennel.name}
        userEmail={user.email || ''}
        initial={campaign}
        audiences={audiences}
        // /newsletter está gateado a Enterprise en el layout → quien llega
        // aquí puede enviar de verdad.
        canSend
      />
    </div>
  )
}
