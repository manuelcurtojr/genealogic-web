import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Mars, Venus, Calendar, Hash, Weight, Ruler, Shield, Heart } from 'lucide-react'
import PedigreeTree from '@/components/pedigree/pedigree-tree'

export default async function DogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dog } = await supabase
    .from('dogs')
    .select(`
      *,
      breed:breeds(id, name),
      color:colors(id, name),
      kennel:kennels(id, name),
      father:dogs!dogs_father_id_fkey(id, name, sex),
      mother:dogs!dogs_mother_id_fkey(id, name, sex),
      photos:dog_photos(id, url, position),
      videos:dog_videos(id, url)
    `)
    .eq('id', id)
    .single()

  if (!dog) notFound()

  const isOwner = user?.id === dog.owner_id
  const photos = (dog.photos as any[])?.sort((a: any, b: any) => a.position - b.position) || []
  const mainPhoto = photos[0]?.url
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
          {(dog.breed as any)?.name && (
            <p className="text-white/50 text-sm">{(dog.breed as any).name}</p>
          )}
        </div>
        {isOwner && (
          <Link
            href={`/dogs/${id}/edit`}
            className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Gallery */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {mainPhoto ? (
              <img src={mainPhoto} alt={dog.name} className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center text-white/15 text-6xl">
                {dog.sex === 'male' ? '♂' : '♀'}
              </div>
            )}
            {photos.length > 1 && (
              <div className="flex gap-1 p-2 overflow-x-auto">
                {photos.map((p: any) => (
                  <img key={p.id} src={p.url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info grid */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Informacion</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoCell icon={Calendar} label="Nacimiento" value={dog.birth_date || '—'} />
              <InfoCell icon={Hash} label="Registro" value={dog.registration || '—'} />
              <InfoCell icon={Weight} label="Peso" value={dog.weight ? `${dog.weight} kg` : '—'} />
              <InfoCell icon={Ruler} label="Altura" value={dog.height ? `${dog.height} cm` : '—'} />
              <InfoCell icon={Shield} label="Verificacion" value={dog.verification === 'verified' ? 'Verificado' : dog.verification === 'pending' ? 'Pendiente' : '—'} />
              <InfoCell icon={Heart} label="Color" value={(dog.color as any)?.name || '—'} />
            </div>
          </div>

          {/* Parents */}
          {((dog.father as any) || (dog.mother as any)) && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Padres</h2>
              <div className="grid grid-cols-2 gap-3">
                <ParentCard parent={dog.father as any} role="Padre" />
                <ParentCard parent={dog.mother as any} role="Madre" />
              </div>
            </div>
          )}

          {/* Sale info */}
          {dog.sale_info && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Venta</h2>
              <p className="text-white/70 text-sm">{JSON.stringify(dog.sale_info)}</p>
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
  const sexColor = role === 'Padre' ? 'border-blue-400/50' : 'border-pink-400/50'
  if (!parent) return (
    <div className={`border-2 border-dashed ${sexColor} rounded-lg p-3 text-center text-white/30 text-sm`}>
      {role} desconocido
    </div>
  )
  return (
    <Link href={`/dogs/${parent.id}`} className={`border ${sexColor} bg-white/5 rounded-lg p-3 hover:bg-white/10 transition`}>
      <p className="text-xs text-white/40">{role}</p>
      <p className="text-sm font-semibold text-white">{parent.name}</p>
    </Link>
  )
}
