/**
 * Gate del web builder (/web/*) — feature de Kennel Enterprise (149€).
 * Alta MANUAL (plan kennel_pro o ENTERPRISE_USERS). El resto ve
 * "Próximamente".
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasEnterpriseFeatures } from '@/lib/permissions'
import ComingSoon from '@/components/early-access/coming-soon'

export default async function WebLayout({ children }: { children: React.ReactNode }) {
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
        featureId="web_builder"
        description="Construye la web pública de tu criadero con un builder visual: páginas personalizadas, dominio propio, blog. Disponible próximamente para todos."
        backHref="/dashboard"
        backLabel="← Volver al dashboard"
      />
    )
  }

  return <>{children}</>
}
