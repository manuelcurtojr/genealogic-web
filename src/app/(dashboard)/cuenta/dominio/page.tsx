import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DomainClient from '@/components/billing/domain-client'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const metadata = { title: 'Dominio · Genealogic Pro' }

export default async function DominioPage() {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name, slug, custom_domain, custom_domain_verified, custom_domain_added_at')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">{t('Dominio')}</h1>
        <p className="text-body">{t('Necesitas un criadero registrado.')}</p>
      </div>
    )
  }

  return (
    <DomainClient
      kennelId={kennel.id}
      kennelSlug={kennel.slug}
      kennelName={kennel.name}
      initialDomain={(kennel as any).custom_domain || null}
      initialVerified={Boolean((kennel as any).custom_domain_verified)}
      addedAt={(kennel as any).custom_domain_added_at || null}
    />
  )
}
