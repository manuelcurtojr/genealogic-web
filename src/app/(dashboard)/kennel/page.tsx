import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Edit, Globe, ExternalLink, Calendar, Dog } from 'lucide-react'

export default async function KennelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: kennel } = await supabase
    .from('kennels')
    .select('*')
    .eq('owner_id', user!.id)
    .single()

  if (!kennel) {
    return (
      <div className="text-center py-20">
        <Dog className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">No tienes un criadero</h1>
        <p className="text-white/40 mb-6">Crea tu criadero para gestionar tus perros</p>
        <Link href="/kennel/new" className="bg-[#D74709] hover:bg-[#c03d07] text-white px-6 py-3 rounded-lg font-semibold transition">
          Crear criadero
        </Link>
      </div>
    )
  }

  const { count: dogCount } = await supabase.from('dogs').select('id', { count: 'exact', head: true }).eq('kennel_id', kennel.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mi Criadero</h1>
        <Link href="/kennel/edit" className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
          <Edit className="w-4 h-4" /> Editar
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start gap-6">
          {kennel.logo_url ? (
            <img src={kennel.logo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center text-3xl font-bold text-white/30">
              {kennel.name[0]}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold">{kennel.name}</h2>
            {kennel.description && <p className="text-white/50 text-sm mt-2">{kennel.description}</p>}

            <div className="flex flex-wrap gap-4 mt-4">
              {kennel.foundation_date && (
                <span className="flex items-center gap-1.5 text-sm text-white/50">
                  <Calendar className="w-4 h-4" /> Fundado en {kennel.foundation_date}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-white/50">
                <Dog className="w-4 h-4" /> {dogCount || 0} perros
              </span>
            </div>

            <div className="flex gap-3 mt-4">
              {kennel.website && (
                <a href={kennel.website} target="_blank" rel="noopener" className="text-white/40 hover:text-white transition">
                  <Globe className="w-5 h-5" />
                </a>
              )}
              {kennel.social_instagram && (
                <a href={kennel.social_instagram} target="_blank" rel="noopener" className="text-white/40 hover:text-white transition">
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
              {kennel.social_facebook && (
                <a href={kennel.social_facebook} target="_blank" rel="noopener" className="text-white/40 hover:text-white transition">
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
