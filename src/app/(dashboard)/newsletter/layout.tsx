/**
 * Gate del módulo Newsletter (/newsletter/*) — feature de Kennel
 * Enterprise (149€). Alta MANUAL (plan kennel_pro o ENTERPRISE_USERS).
 * El resto ve "Próximamente".
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasEnterpriseFeatures } from '@/lib/permissions'
import ComingSoon from '@/components/early-access/coming-soon'

export default async function NewsletterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  if (!hasEnterpriseFeatures(profile?.plan, user.id)) {
    return (
      <ComingSoon
        featureId="newsletter"
        description="Mantén informados a tus clientes y lista de espera: campañas, plantillas, segmentación. Disponible próximamente para todos."
        backHref="/dashboard"
        backLabel="← Volver al dashboard"
      />
    )
  }

  return <>{children}</>
}
