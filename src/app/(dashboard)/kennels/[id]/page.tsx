import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Calendar, Dog, ExternalLink } from 'lucide-react'
import { BRAND } from '@/lib/constants'

export default async function KennelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: kennel } = await supabase
    .from('kennels')
    .select('*')
    .eq('id', id)
    .single()

  if (!kennel) notFound()

  // Fetch kennel's dogs
  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, breed:breeds(name)')
    .eq('kennel_id', id)
    .order('name')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/kennels" className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#D74709]/10 flex items-center justify-center flex-shrink-0 border border-[#D74709]/20">
            {kennel.logo_url ? (
              <img src={kennel.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span className="text-2xl font-bold text-[#D74709]">{kennel.name[0]}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{kennel.name}</h1>
            {kennel.foundation_date && (
              <p className="text-sm text-white/40 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                Fundado en {new Date(kennel.foundation_date).getFullYear()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="space-y-4">
          {kennel.description && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Descripcion</h2>
              <p className="text-sm text-white/70 leading-relaxed">{kennel.description}</p>
            </div>
          )}

          {/* Social links */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Redes</h2>
            <div className="space-y-2">
              {kennel.website && (
                <a href={kennel.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/60 hover:text-[#D74709] transition">
                  <Globe className="w-4 h-4" /> Web
                </a>
              )}
              {kennel.social_instagram && (
                <a href={`https://instagram.com/${kennel.social_instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/60 hover:text-[#D74709] transition">
                  <ExternalLink className="w-4 h-4" /> @{kennel.social_instagram}
                </a>
              )}
              {kennel.social_facebook && (
                <a href={kennel.social_facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/60 hover:text-[#D74709] transition">
                  <ExternalLink className="w-4 h-4" /> Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Dogs */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">
            <Dog className="w-4 h-4 inline mr-1" />
            Perros del criadero ({(dogs || []).length})
          </h2>
          {(!dogs || dogs.length === 0) ? (
            <div className="text-center py-12 text-white/30">No hay perros registrados en este criadero</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dogs.map((dog: any) => {
                const borderColor = dog.sex === 'male' ? BRAND.male : BRAND.female
                return (
                  <Link
                    key={dog.id}
                    href={`/dogs/${dog.id}`}
                    className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition"
                  >
                    <div className="relative aspect-square bg-white/5">
                      {dog.thumbnail_url ? (
                        <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/15 text-3xl">
                          {dog.sex === 'male' ? '♂' : '♀'}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: borderColor }} />
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-semibold text-white truncate">{dog.name}</p>
                      {dog.breed?.name && <p className="text-xs text-white/40 truncate">{dog.breed.name}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
