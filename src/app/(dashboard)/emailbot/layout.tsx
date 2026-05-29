/**
 * Gate del Emailbot (/emailbot/*) — feature de Kennel Enterprise (149€).
 * Enterprise es de alta MANUAL hoy (plan kennel_pro en BBDD o estar en
 * ENTERPRISE_USERS). El resto ve "Próximamente".
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasEnterpriseFeatures } from '@/lib/permissions'
import ComingSoon from '@/components/early-access/coming-soon'

export default async function EmailbotLayout({ children }: { children: React.ReactNode }) {
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
        featureId="emailbot"
        description="Asistente IA que responde por email a consultas de cachorros usando la biblioteca de tu criadero. Disponible próximamente para todos."
        backHref="/dashboard"
        backLabel="← Volver al dashboard"
      />
    )
  }

  return <>{children}</>
}
