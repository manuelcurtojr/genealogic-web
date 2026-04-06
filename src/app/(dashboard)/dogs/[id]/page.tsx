import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Mars, Venus, Calendar, Hash, Weight, Ruler, Microchip, Home, Trash2, Palette } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import PedigreeTree from '@/components/pedigree/pedigree-tree'
import DogGallery from '@/components/dogs/dog-gallery'
import DogDetailActions from '@/components/dogs/dog-detail-actions'
import DogTabs from '@/components/dogs/dog-tabs'

export default async function DogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dog } = await supabase
    .from('dogs')
    .select(`*, breed:breeds(id, name), color:colors(id, name), kennel:kennels(id, name, logo_url)`)
    .eq('id', id)
    .single()

  if (!dog) notFound()

  const [fatherRes, motherRes] = await Promise.all([
    dog.father_id ? supabase.from('dogs').select('id, name, sex, thumbnail_url').eq('id', dog.father_id).single() : { data: null },
    dog.mother_id ? supabase.from('dogs').select('id, name, sex, thumbnail_url').eq('id', dog.mother_id).single() : { data: null },
  ])
  const father = fatherRes.data
  const mother = motherRes.data

  const isOwner = user?.id === dog.owner_id
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const SexIcon = dog.sex === 'male' ? Mars : Venus
  const breedName = (dog.breed as any)?.name
  const colorName = (dog.color as any)?.name
  const kennel = dog.kennel as any

  const { data: pedigree } = await supabase.rpc('get_pedigree', { dog_uuid: id, max_gen: 5 })

  return (
    <div className="-mx-[30px] -mt-[30px]">
      {/* Gallery — full width, edge-to-edge */}
      <div className="relative">
        <DogGallery thumbnail_url={dog.thumbnail_url} name={dog.name} sex={dog.sex} />

        {/* Floating buttons over gallery */}
        {isOwner && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Link
              href={`/dogs/${id}/edit`}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border border-white/20"
            >
              <Edit className="w-4 h-4" />
              Editar perro
            </Link>
          </div>
        )}

        {/* Back button */}
        <Link href="/dogs" className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Content below gallery */}
      <div className="px-[30px] pt-6 pb-8">
        {/* Name + Breed badge + Kennel badge */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold">{dog.name}</h1>
          <SexIcon className="w-6 h-6" style={{ color: sexColor }} />
          {breedName && (
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <img src="/icon.svg" alt="" className="w-4 h-4" />
              <span className="text-sm text-white/70 font-medium">{breedName}</span>
            </div>
          )}
          {kennel?.name && (
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              {kennel.logo_url ? (
                <img src={kennel.logo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <img src="/icon.svg" alt="" className="w-4 h-4" />
              )}
              <span className="text-sm text-white/70 font-medium">{kennel.name}</span>
            </div>
          )}
        </div>

        {/* Info chips — horizontal like WP */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <InfoChip icon={dog.sex === 'male' ? Mars : Venus} label="Sexo" value={dog.sex === 'male' ? 'Macho' : 'Hembra'} color={sexColor} />
          {colorName && <InfoChip icon={Palette} label="Color" value={colorName} />}
          {dog.birth_date && <InfoChip icon={Calendar} label="Nacimiento" value={new Date(dog.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} />}
          {dog.weight && <InfoChip icon={Weight} label="Peso" value={`${dog.weight} kg`} />}
          {dog.height && <InfoChip icon={Ruler} label="Altura" value={`${dog.height} cm`} />}
          {dog.registration && <InfoChip icon={Hash} label="Registro" value={dog.registration} />}
          {dog.microchip && <InfoChip icon={Microchip} label="Microchip" value={dog.microchip} />}
        </div>

        {/* Parents */}
        {(father || mother) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <ParentCard parent={father} role="Padre" />
            <ParentCard parent={mother} role="Madre" />
          </div>
        )}

        {/* Pedigree — free flowing, no box */}
        {pedigree && pedigree.length > 1 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Pedigri</h2>
            <PedigreeTree data={pedigree} rootId={id} />
          </div>
        )}

        {/* Tabs: Salud, Palmares, Hermanos, Descendientes */}
        <DogTabs
          dogId={id}
          ownerId={dog.owner_id}
          isOwner={isOwner}
          fatherId={dog.father_id}
          motherId={dog.mother_id}
          dogSex={dog.sex}
        />
      </div>
    </div>
  )
}

function InfoChip({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
      <Icon className="w-4 h-4 text-white/40 flex-shrink-0" style={color ? { color } : undefined} />
      <span className="text-xs text-white/40 font-semibold">{label}:</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  )
}

function ParentCard({ parent, role }: { parent: any; role: string }) {
  const isFather = role === 'Padre'
  const sexColor = isFather ? BRAND.male : BRAND.female
  const borderClass = isFather ? 'border-blue-400/40' : 'border-pink-400/40'

  if (!parent) return (
    <div className={`border-2 border-dashed ${borderClass} rounded-xl p-4 text-center text-white/30 text-sm`}>
      {role} desconocido
    </div>
  )

  return (
    <Link href={`/dogs/${parent.id}`} className={`border ${borderClass} bg-white/5 rounded-xl p-4 hover:bg-white/10 transition flex items-center gap-4`}>
      <div className="w-12 h-12 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
        {parent.thumbnail_url ? (
          <img src={parent.thumbnail_url} alt={parent.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/icon.svg" alt="" className="w-6 h-6 opacity-20" />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">{role}</p>
        <p className="text-base font-bold text-white">{parent.name}</p>
      </div>
    </Link>
  )
}
