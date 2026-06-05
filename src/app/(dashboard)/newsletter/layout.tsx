/**
 * Gate del módulo Newsletter (/newsletter/*) — feature de Kennel
 * Enterprise (149€). Alta MANUAL (plan kennel_pro o ENTERPRISE_USERS).
 * El resto ve "Próximamente".
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { kennelHasAddon } from '@/lib/kennel/addons'
import ComingSoon from '@/components/early-access/coming-soon'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export default async function NewsletterLayout({ children }: { children: React.ReactNode }) {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ks } = await supabase
    .from('kennels')
    .select('addons, owner_id')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = ks?.[0] || null

  if (!kennelHasAddon(kennel, 'newsletter', user.id)) {
    return (
      <ComingSoon
        featureId="newsletter"
        description={t('Mantén informados a tus clientes y lista de espera: campañas, plantillas, segmentación. Es una extensión de Kennel Pro.')}
        backHref="/dashboard"
        backLabel={t('← Volver al dashboard')}
      />
    )
  }

  return <>{children}</>
}
