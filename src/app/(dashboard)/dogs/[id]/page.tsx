import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Mars, Venus, Calendar, Hash, Weight, Ruler, Microchip, Palette, Heart } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import PedigreeTree from '@/components/pedigree/pedigree-tree'
import DogGallery from '@/components/dogs/dog-gallery'
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

  // Fetch gallery photos + pedigree
  const [photosRes, pedigreeRes] = await Promise.all([
    supabase.from('dog_photos').select('id, url, position').eq('dog_id', id).order('position'),
    supabase.rpc('get_pedigree', { dog_uuid: id, max_gen: 5 }),
  ])
  const galleryPhotos = (photosRes.data || []).map((p: any) => p.url)
  // Include thumbnail_url as first photo if not already in gallery
  if (dog.thumbnail_url && !galleryPhotos.includes(dog.thumbnail_url)) {
    galleryPhotos.unshift(dog.thumbnail_url)
  }
  const pedigree = pedigreeRes.data

  return (
    <div className="-mx-[30px] -mt-[30px]">
      {/* Gallery — flush to header and sidebar, square crop */}
      <div className="relative">
        <DogGallery photos={galleryPhotos} name={dog.name} sex={dog.sex} />

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isOwner && (
            <Link href={`/dogs/${id}/edit`}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border border-white/20">
              <Edit className="w-4 h-4" /> Editar perro
            </Link>
          )}
          <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        <Link href="/dogs" className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Content */}
      <div className="px-[30px] pt-5 pb-8">
        {/* Name + badges */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
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
              {kennel.logo_url ? <img src={kennel.logo_url} alt="" className="w-4 h-4 rounded-full object-cover" /> : <img src="/icon.svg" alt="" className="w-4 h-4" />}
              <span className="text-sm text-white/70 font-medium">{kennel.name}</span>
            </div>
          )}
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <Chip icon={dog.sex === 'male' ? Mars : Venus} label="Sexo" value={dog.sex === 'male' ? 'Macho' : 'Hembra'} color={sexColor} />
          {colorName && <Chip icon={Palette} label="Color" value={colorName} />}
          {dog.birth_date && <Chip icon={Calendar} label="Nacimiento" value={new Date(dog.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} />}
          {dog.weight && <Chip icon={Weight} label="Peso" value={`${dog.weight} kg`} />}
          {dog.height && <Chip icon={Ruler} label="Altura" value={`${dog.height} cm`} />}
        </div>

        {/* Parents */}
        {(father || mother) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <ParentCard parent={father} role="Padre" />
            <ParentCard parent={mother} role="Madre" />
          </div>
        )}

        {/* Tabs — right after parents */}
        <DogTabs dogId={id} ownerId={dog.owner_id} isOwner={isOwner} fatherId={dog.father_id} motherId={dog.mother_id} dogSex={dog.sex} />

        {/* Pedigree */}
        {pedigree && pedigree.length > 1 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-6">Pedigri</h2>
            <PedigreeTree data={pedigree} rootId={id} />
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
      <Icon className="w-3.5 h-3.5 text-white/40 flex-shrink-0" style={color ? { color } : undefined} />
      <span className="text-[11px] text-white/40 font-semibold">{label}:</span>
      <span className="text-[13px] text-white font-medium">{value}</span>
    </div>
  )
}

function ParentCard({ parent, role }: { parent: any; role: string }) {
  const isFather = role === 'Padre'
  const sexColor = isFather ? BRAND.male : BRAND.female
  const borderClass = isFather ? 'border-blue-400/40' : 'border-pink-400/40'

  if (!parent) return (
    <div className={`border-2 border-dashed ${borderClass} rounded-xl p-3 text-center text-white/30 text-sm`}>{role} desconocido</div>
  )

  return (
    <Link href={`/dogs/${parent.id}`} className={`border ${borderClass} bg-white/5 rounded-xl p-3 hover:bg-white/10 transition flex items-center gap-3`}>
      <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
        {parent.thumbnail_url
          ? <img src={parent.thumbnail_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-5 h-5 opacity-20" /></div>}
      </div>
      <div>
        <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">{role}</p>
        <p className="text-sm font-bold text-white">{parent.name}</p>
      </div>
    </Link>
  )
}
