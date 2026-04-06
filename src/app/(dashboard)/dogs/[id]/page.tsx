import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Mars, Venus, Calendar, Hash, Weight, Ruler, Shield, Heart, Trash2, Microchip, Home } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import PedigreeTree from '@/components/pedigree/pedigree-tree'
import DogGallery from '@/components/dogs/dog-gallery'
import DogDetailActions from '@/components/dogs/dog-detail-actions'

export default async function DogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // First get the dog basic data
  const { data: dog } = await supabase
    .from('dogs')
    .select(`
      *,
      breed:breeds(id, name),
      color:colors(id, name),
      kennel:kennels(id, name)
    `)
    .eq('id', id)
    .single()

  if (!dog) notFound()

  // Fetch father and mother separately (self-referencing FK doesn't work inline)
  const [fatherRes, motherRes] = await Promise.all([
    dog.father_id ? supabase.from('dogs').select('id, name, sex, thumbnail_url').eq('id', dog.father_id).single() : { data: null },
    dog.mother_id ? supabase.from('dogs').select('id, name, sex, thumbnail_url').eq('id', dog.mother_id).single() : { data: null },
  ])
  const father = fatherRes.data
  const mother = motherRes.data

  const isOwner = user?.id === dog.owner_id
  const sexColor = dog.sex === 'male' ? 'text-blue-400' : 'text-pink-400'
  const SexIcon = dog.sex === 'male' ? Mars : Venus

  // Fetch pedigree
  const { data: pedigree } = await supabase.rpc('get_pedigree', { dog_uuid: id, max_gen: 4 })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dogs" className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {dog.name}
            <SexIcon className={`w-5 h-5 ${sexColor}`} />
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {(dog.breed as any)?.name && (
              <span className="text-xs bg-[#D74709]/15 text-[#D74709] rounded-full px-2.5 py-0.5 font-medium">
                {(dog.breed as any).name}
              </span>
            )}
            {(dog.color as any)?.name && (
              <span className="text-xs bg-white/10 text-white/60 rounded-full px-2.5 py-0.5">
                {(dog.color as any).name}
              </span>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Link
              href={`/dogs/${id}/edit`}
              className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>
            <DogDetailActions dogId={id} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Photo */}
        <div className="lg:col-span-1">
          <DogGallery thumbnail_url={dog.thumbnail_url} name={dog.name} sex={dog.sex} />
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info grid */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Informacion</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoCell icon={Calendar} label="Nacimiento" value={dog.birth_date ? new Date(dog.birth_date).toLocaleDateString('es-ES') : '—'} />
              <InfoCell icon={Hash} label="Registro" value={dog.registration || '—'} />
              <InfoCell icon={Weight} label="Peso" value={dog.weight ? `${dog.weight} kg` : '—'} />
              <InfoCell icon={Ruler} label="Altura" value={dog.height ? `${dog.height} cm` : '—'} />
              <InfoCell icon={Microchip} label="Microchip" value={dog.microchip || '—'} />
              <InfoCell icon={Home} label="Criadero" value={(dog.kennel as any)?.name || '—'} />
            </div>
          </div>

          {/* Parents */}
          {(father || mother) && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Padres</h2>
              <div className="grid grid-cols-2 gap-3">
                <ParentCard parent={father} role="Padre" />
                <ParentCard parent={mother} role="Madre" />
              </div>
            </div>
          )}

          {/* Sale info */}
          {dog.sale_info && (dog.sale_info as any).price && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Venta</h2>
              <p className="text-2xl font-bold text-[#D74709]">{(dog.sale_info as any).price} {(dog.sale_info as any).currency || '€'}</p>
              {(dog.sale_info as any).description && (
                <p className="text-sm text-white/60 mt-2">{(dog.sale_info as any).description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pedigree */}
      {pedigree && pedigree.length > 1 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Pedigri</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 overflow-x-auto">
            <PedigreeTree data={pedigree} rootId={id} />
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCell({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-white/30 mt-0.5" />
      <div>
        <p className="text-xs text-white/40">{label}</p>
        <p className="text-sm text-white font-medium">{value}</p>
      </div>
    </div>
  )
}

function ParentCard({ parent, role }: { parent: any; role: string }) {
  const isFather = role === 'Padre'
  const sexColor = isFather ? BRAND.male : BRAND.female
  const borderClass = isFather ? 'border-blue-400/50' : 'border-pink-400/50'

  if (!parent) return (
    <div className={`border-2 border-dashed ${borderClass} rounded-lg p-3 text-center text-white/30 text-sm`}>
      {role} desconocido
    </div>
  )

  return (
    <Link href={`/dogs/${parent.id}`} className={`border ${borderClass} bg-white/5 rounded-lg p-3 hover:bg-white/10 transition flex items-center gap-3`}>
      <div
        className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5"
        style={{ borderColor: sexColor }}
      >
        {parent.thumbnail_url ? (
          <img src={parent.thumbnail_url} alt={parent.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
            {isFather ? '♂' : '♀'}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-white/40">{role}</p>
        <p className="text-sm font-semibold text-white">{parent.name}</p>
      </div>
    </Link>
  )
}
