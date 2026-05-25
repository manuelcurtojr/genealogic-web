/**
 * Gate Early Access para todo el módulo Newsletter (/newsletter/*).
 * Solo Irema Curtó lo ve hasta que abramos al resto.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isEarlyAccessKennel } from '@/lib/early-access'
import ComingSoon from '@/components/early-access/coming-soon'

export default async function NewsletterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!isEarlyAccessKennel(kennel?.id)) {
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
