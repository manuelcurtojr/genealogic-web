/**
 * Gate Early Access para todo el Emailbot (/emailbot/*).
 * Solo Irema Curtó lo ve hasta que abramos al resto.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isEarlyAccessKennel } from '@/lib/early-access'
import ComingSoon from '@/components/early-access/coming-soon'

export default async function EmailbotLayout({ children }: { children: React.ReactNode }) {
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
        featureId="emailbot"
        description="Asistente IA que responde por email a consultas de cachorros usando la biblioteca de tu criadero. Disponible próximamente para todos."
        backHref="/dashboard"
        backLabel="← Volver al dashboard"
      />
    )
  }

  return <>{children}</>
}
