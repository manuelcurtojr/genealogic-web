import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Calendar, Dog, ExternalLink, Heart, MessageCircle } from 'lucide-react'
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

  // Fetch visible kennel dogs
  const { data: allDogs } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, is_reproductive, breed:breeds(name)')
    .eq('kennel_id', id)
    .eq('show_in_kennel', true)
    .order('name')

  const dogs = allDogs || []
  const reproductores = dogs.filter((d: any) => d.is_reproductive)
  const criados = dogs.filter((d: any) => !d.is_reproductive)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/kennels" className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Kennel banner */}
      <div className="relative bg-gradient-to-r from-[#D74709]/20 to-[#D74709]/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
        <div className="px-6 py-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
            {kennel.logo_url ? (
              <img src={kennel.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white/20">{kennel.name[0]}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{kennel.name}</h1>
            {kennel.description && <p className="text-sm text-white/50 mt-1 line-clamp-2">{kennel.description}</p>}
            <div className="flex flex-wrap gap-4 mt-3">
              {kennel.foundation_date && (
                <span className="flex items-center gap-1.5 text-xs text-white/40">
                  <Calendar className="w-3.5 h-3.5" /> Fundado en {new Date(kennel.foundation_date).getFullYear()}
                </span>
              )}
              {kennel.website && (
                <a href={kennel.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#D74709] transition">
                  <Globe className="w-3.5 h-3.5" /> Sitio web
                </a>
              )}
              {kennel.social_instagram && (
                <a href={kennel.social_instagram} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-pink-400 transition">
                  <ExternalLink className="w-3.5 h-3.5" /> Instagram
                </a>
              )}
              {kennel.social_facebook && (
                <a href={kennel.social_facebook} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-blue-400 transition">
                  <ExternalLink className="w-3.5 h-3.5" /> Facebook
                </a>
              )}
              {kennel.whatsapp_enabled && kennel.whatsapp_phone && (
                <a href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || '')}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-green-400 transition">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold">{dogs.length}</p>
              <p className="text-[10px] text-white/40 uppercase">Perros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-400">{reproductores.length}</p>
              <p className="text-[10px] text-white/40 uppercase">Reproductores</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reproductores section */}
      {reproductores.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-pink-400" />
            <h2 className="text-lg font-semibold">Reproductores</h2>
            <span className="text-xs text-white/30 bg-white/5 rounded-full px-2 py-0.5">{reproductores.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {reproductores.map((dog: any) => (
              <PublicDogCard key={dog.id} dog={dog} />
            ))}
          </div>
        </section>
      )}

      {/* Criados section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Dog className="w-4 h-4 text-[#D74709]" />
          <h2 className="text-lg font-semibold">Criados por {kennel.name}</h2>
          <span className="text-xs text-white/30 bg-white/5 rounded-full px-2 py-0.5">{criados.length}</span>
        </div>
        {criados.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl text-white/30">
            No hay perros visibles en este criadero
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {criados.map((dog: any) => (
              <PublicDogCard key={dog.id} dog={dog} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function PublicDogCard({ dog }: { dog: any }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const sexIcon = dog.sex === 'male' ? '♂' : '♀'
  return (
    <Link href={`/dogs/${dog.id}`} className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/30 transition group">
      <div className="relative aspect-square bg-white/5">
        {dog.thumbnail_url ? (
          <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Dog className="w-10 h-10 text-white/10" /></div>
        )}
        {dog.breed?.name && <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">{dog.breed.name}</span>}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </div>
      <div className="p-2.5">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold truncate group-hover:text-[#D74709] transition">{dog.name}</p>
          <span className="text-xs" style={{ color: sexColor }}>{sexIcon}</span>
        </div>
        {dog.breed?.name && <p className="text-[11px] text-white/40 truncate">{dog.breed.name}</p>}
      </div>
    </Link>
  )
}
