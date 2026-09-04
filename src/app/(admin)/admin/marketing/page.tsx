import { createKennelAdminClient } from '@/lib/supabase/server'
import { getLeads } from '@/lib/marketing/queries'
import LeadBoard from '@/components/admin/marketing/lead-board'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Marketing CRM' }

export default async function MarketingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const leads = await getLeads(admin)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Marketing CRM</h1>
        <p className="text-sm text-muted mt-1">
          Adquisición de criaderos — embudo de growth de la plataforma.
        </p>
      </div>
      <LeadBoard leads={leads} />
    </div>
  )
}
