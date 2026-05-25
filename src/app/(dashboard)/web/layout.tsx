/**
 * Gate Early Access para todo el web builder (/web/*).
 * Solo Irema Curtó lo ve hasta que abramos al resto.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isEarlyAccessKennel } from '@/lib/early-access'
import ComingSoon from '@/components/early-access/coming-soon'

export default async function WebLayout({ children }: { children: React.ReactNode }) {
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
        featureId="web_builder"
        description="Construye la web pública de tu criadero con un builder visual: páginas personalizadas, dominio propio, blog. Disponible próximamente para todos."
        backHref="/dashboard"
        backLabel="← Volver al dashboard"
      />
    )
  }

  return <>{children}</>
}
