import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, Baby, Eye, EyeOff, Dog, MessageCircle, FileText, MapPin } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import PedigreeTree from '@/components/pedigree/pedigree-tree'

export default async function LitterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: litter } = await supabase
    .from('litters')
    .select(`
      *,
      breed:breeds(id, name),
      father:dogs!litters_father_id_fkey(id, name, sex, thumbnail_url, breed:breeds(name)),
      mother:dogs!litters_mother_id_fkey(id, name, sex, thumbnail_url, breed:breeds(name))
    `)
    .eq('id', id)
    .single()

  if (!litter) notFound()

  // Check if public litter or owner
  const isOwner = user?.id === litter.owner_id
  const isPublic = litter.is_public

  // If not public and not owner, show 404
  if (!isPublic && !isOwner) notFound()

  const father = litter.father as any
  const mother = litter.mother as any
  const breedName = (litter.breed as any)?.name

  // Get kennel info for the inquiry button
  const { data: kennelArr } = await supabase.from('kennels').select('id, name, logo_url, whatsapp_enabled, whatsapp_phone, whatsapp_text').eq('owner_id', litter.owner_id).limit(1)
  const kennel = kennelArr?.[0]

  // Fetch puppies (dogs with same father + mother)
  let puppies: any[] = []
  if (father?.id && mother?.id) {
    const { data } = await supabase.from('dogs')
      .select('id, name, sex, thumbnail_url, breed:breeds(name)')
      .eq('father_id', father.id).eq('mother_id', mother.id).order('name')
    puppies = data || []
  }

  // Build combined pedigree from father + mother
  let pedigreeData: any[] = []
  let pedigreeRootId: string | null = null
  if (father?.id && mother?.id) {
    // Create a virtual root representing the litter
    const virtualRootId = `litter-${id}`
    pedigreeRootId = virtualRootId

    // Fetch father and mother pedigrees
    const [fatherPed, motherPed] = await Promise.all([
      supabase.rpc('get_pedigree', { dog_uuid: father.id, max_gen: 4 }),
      supabase.rpc('get_pedigree', { dog_uuid: mother.id, max_gen: 4 }),
    ])

    // Virtual root node
    pedigreeData.push({
      id: virtualRootId,
      name: `${father.name} × ${mother.name}`,
      sex: 'male',
      registration: null,
      father_id: father.id,
      mother_id: mother.id,
      generation: 0,
      photo_url: null,
      breed_name: breedName,
      color_name: null,
    })

    // Add father and mother pedigree data (offset generations)
    const fatherData = (fatherPed.data || []).map((d: any) => ({ ...d, generation: d.generation + 1 }))
    const motherData = (motherPed.data || []).map((d: any) => ({ ...d, generation: d.generation + 1 }))

    // Merge without duplicates
    const seen = new Set([virtualRootId])
    for (const d of [...fatherData, ...motherData]) {
      if (!seen.has(d.id)) { pedigreeData.push(d); seen.add(d.id) }
    }
  }

  const statusConfig: Record<string, { label: string; color: string; desc: string }> = {
    planned: { label: 'Planificada', color: '#3B82F6', desc: 'El cruce esta planificado pero aun no se ha realizado' },
    mated: { label: 'Cubricion', color: '#F59E0B', desc: 'El cruce se ha realizado, esperando confirmacion' },
    born: { label: 'Nacida', color: '#10B981', desc: 'Los cachorros han nacido' },
    confirmed: { label: 'Confirmada', color: '#10B981', desc: 'Camada confirmada' },
    pending: { label: 'Pendiente', color: '#F59E0B', desc: 'Estado pendiente' },
  }
  const status = statusConfig[litter.status] || statusConfig.planned

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/litters" className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{father?.name || '?'} × {mother?.name || '?'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={{ backgroundColor: status.color + '20', color: status.color }}>{status.label}</span>
            {breedName && <span className="text-xs bg-white/10 text-white/60 rounded-full px-2.5 py-0.5">{breedName}</span>}
            {litter.is_public && <span className="text-xs bg-green-500/10 text-green-400 rounded-full px-2.5 py-0.5">Publica</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Inquiry button - public */}
          {kennel && (
            <Link href={`/form/${kennel.id}`}
              className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
              <FileText className="w-4 h-4" /> Pedir informacion
            </Link>
          )}
          {/* WhatsApp - public */}
          {kennel?.whatsapp_enabled && kennel.whatsapp_phone && (
            <a href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || `Hola, me interesa la camada de ${father?.name || ''} x ${mother?.name || ''}`)}`}
              target="_blank" rel="noopener"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          {/* Edit - owner only */}
          {isOwner && (
            <Link href={`/litters/${id}/edit`}
              className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
              <Edit className="w-4 h-4" /> Editar
            </Link>
          )}
        </div>
      </div>

      {/* Parents - public */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ParentCard parent={father} role="Padre" />
        <ParentCard parent={mother} role="Madre" />
      </div>

      {/* Info - public parts */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCell icon={Calendar} label="Estado" value={status.label} />
          {litter.birth_date && <InfoCell icon={Calendar} label="Nacimiento" value={new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} />}
          {litter.mating_date && <InfoCell icon={Calendar} label="Fecha de cruce" value={new Date(litter.mating_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} />}
          {litter.puppy_count != null && <InfoCell icon={Baby} label="Cachorros" value={`${litter.puppy_count}`} />}
          {breedName && <InfoCell icon={Dog} label="Raza" value={breedName} />}
          {/* Private info - owner only */}
          {isOwner && <InfoCell icon={litter.is_public ? Eye : EyeOff} label="Visibilidad" value={litter.is_public ? 'Publica' : 'Privada'} />}
        </div>
        <p className="text-xs text-white/25 mt-3">{status.desc}</p>
      </div>

      {/* Kennel badge - public */}
      {kennel && (
        <Link href={`/kennels/${kennel.id}`} className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6 hover:border-[#D74709]/30 transition">
          {kennel.logo_url ? <img src={kennel.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-[#D74709]/20 flex items-center justify-center text-[#D74709] font-bold text-sm">{kennel.name[0]}</div>}
          <div>
            <p className="text-xs text-white/40">Criadero</p>
            <p className="text-sm font-semibold">{kennel.name}</p>
          </div>
        </Link>
      )}

      {/* Puppies - public */}
      {puppies.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Dog className="w-5 h-5 text-[#D74709]" /> Cachorros ({puppies.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {puppies.map((pup: any) => {
              const sexColor = pup.sex === 'male' ? BRAND.male : BRAND.female
              return (
                <Link key={pup.id} href={`/dogs/${pup.id}`}
                  className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/50 transition group">
                  <div className="aspect-square bg-white/5 relative">
                    {pup.thumbnail_url ? <img src={pup.thumbnail_url} alt={pup.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Dog className="w-8 h-8 text-white/10" /></div>}
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: sexColor }} />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate group-hover:text-[#D74709] transition">{pup.name}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Pedigree tree - public */}
      {pedigreeData.length > 1 && pedigreeRootId && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Genealogia de la camada</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 overflow-hidden">
            <PedigreeTree data={pedigreeData} rootId={pedigreeRootId} />
          </div>
        </div>
      )}
    </div>
  )
}

function ParentCard({ parent, role }: { parent: any; role: string }) {
  const isFather = role === 'Padre'
  const sexColor = isFather ? BRAND.male : BRAND.female
  if (!parent) return <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center"><p className="text-white/30 text-sm">{role} desconocido</p></div>
  return (
    <Link href={`/dogs/${parent.id}`} className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/50 transition flex">
      <div className="w-28 h-28 flex-shrink-0 bg-white/5 relative">
        {parent.thumbnail_url ? <img src={parent.thumbnail_url} alt={parent.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/10 text-3xl">{isFather ? '♂' : '♀'}</div>}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: sexColor }} />
      </div>
      <div className="p-4 flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[10px] text-white/40 uppercase tracking-wider">{role}</p>
        <p className="font-semibold text-base truncate mt-0.5">{parent.name}</p>
        {parent.breed?.name && <p className="text-xs text-white/40 mt-1">{parent.breed.name}</p>}
      </div>
    </Link>
  )
}

function InfoCell({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-white/30 mt-0.5" />
      <div>
        <p className="text-xs text-white/40">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
