import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ensureDefaultPipelines, getKennelPipelines } from '@/lib/pipelines/queries'
import FunnelConfig from '@/components/embudo/funnel-config'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Configurar embudo · Genealogic' }

export default async function EmbudoConfigPage() {
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
  if (!kennel) redirect('/embudo')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  await ensureDefaultPipelines(admin, kennel.id)
  const pipelines = await getKennelPipelines(supabase, kennel.id)

  return <FunnelConfig pipelines={pipelines} />
}
