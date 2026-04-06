import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Dog } from 'lucide-react'
import KennelDashboard from '@/components/kennel/kennel-dashboard'

export default async function KennelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: kennel } = await supabase
    .from('kennels')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!kennel) {
    return (
      <div className="text-center py-20">
        <Dog className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">No tienes un criadero</h1>
        <p className="text-white/40 mb-6">Crea tu criadero para gestionar tus perros y tu perfil publico</p>
        <Link href="/kennel/new" className="bg-[#D74709] hover:bg-[#c03d07] text-white px-6 py-3 rounded-lg font-semibold transition">
          Crear criadero
        </Link>
      </div>
    )
  }

  // Fetch kennel dogs with breed info
  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, is_public, breed:breeds(name), birth_date, color:colors(name)')
    .eq('kennel_id', kennel.id)
    .order('name')

  // Fetch litters
  const { data: litters } = await supabase
    .from('litters')
    .select('id, name, status')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <KennelDashboard
      kennel={kennel}
      dogs={dogs || []}
      litters={litters || []}
      userId={user.id}
    />
  )
}
