import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Baby, Eye, EyeOff, Dog, MessageCircle, FileText, Check, Circle } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import PedigreeTree from '@/components/pedigree/pedigree-tree'
import LitterEditButton from '@/components/litters/litter-edit-button'
import LitterWaitingList from '@/components/litters/litter-waiting-list'

export default async function LitterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: litter } = await supabase
    .from('litters')
    .select(`*, breed:breeds(id, name), father:dogs!litters_father_id_fkey(id, name, sex, thumbnail_url, breed:breeds(name)), mother:dogs!litters_mother_id_fkey(id, name, sex, thumbnail_url, breed:breeds(name))`)
    .eq('id', id).single()

  if (!litter) notFound()
  const isOwner = user?.id === litter.owner_id
  if (!litter.is_public && !isOwner) notFound()

  const father = litter.father as any
  const mother = litter.mother as any
  const breedName = (litter.breed as any)?.name

  const { data: kennelArr } = await supabase.from('kennels').select('id, name, logo_url, whatsapp_enabled, whatsapp_phone, whatsapp_text, affix_format').eq('owner_id', litter.owner_id).limit(1)
  const kennel = kennelArr?.[0]

  // Check if form exists for this kennel
  let hasForm = false
  if (kennel?.id) {
    const { data: forms } = await supabase.from('kennel_forms').select('id').eq('kennel_id', kennel.id).eq('is_active', true).limit(1)
    hasForm = (forms?.length || 0) > 0
  }

  let puppies: any[] = []
  if (father?.id && mother?.id) {
    const { data } = await supabase.from('dogs').select('id, name, sex, thumbnail_url').eq('father_id', father.id).eq('mother_id', mother.id).order('name')
    puppies = data || []
  }

  // Combined pedigree
  let pedigreeData: any[] = []
  let pedigreeRootId: string | null = null
  if (father?.id && mother?.id) {
    const virtualRootId = `litter-${id}`
    pedigreeRootId = virtualRootId
    const [fatherPed, motherPed] = await Promise.all([
      supabase.rpc('get_pedigree', { dog_uuid: father.id, max_gen: 4 }),
      supabase.rpc('get_pedigree', { dog_uuid: mother.id, max_gen: 4 }),
    ])
    pedigreeData.push({ id: virtualRootId, name: `Camada`, sex: 'male', registration: null, father_id: father.id, mother_id: mother.id, generation: 0, photo_url: null, breed_name: breedName, color_name: null })
    const seen = new Set([virtualRootId])
    for (const d of [...(fatherPed.data || []), ...(motherPed.data || [])]) {
      if (!seen.has(d.id)) { pedigreeData.push({ ...d, generation: d.generation + 1 }); seen.add(d.id) }
    }
  }

  // Timeline steps
  const steps = [
    { key: 'planned', label: 'Planificada', date: litter.created_at, active: true },
    { key: 'mated', label: 'Cubricion', date: litter.mating_date, active: ['mated', 'born', 'confirmed'].includes(litter.status) },
    { key: 'born', label: 'Nacimiento', date: litter.birth_date, active: ['born', 'confirmed'].includes(litter.status) },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/litters" className="text-white/40 hover:text-white transition"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{father?.name || '?'} × {mother?.name || '?'}</h1>
              {breedName && <span className="text-xs bg-white/10 text-white/50 rounded-full px-2 py-0.5">{breedName}</span>}
            </div>
            {kennel && (
              <Link href={`/kennels/${kennel.id}`} className="text-xs text-white/40 hover:text-[#D74709] transition flex items-center gap-1 mt-0.5">
                {kennel.logo_url ? <img src={kennel.logo_url} alt="" className="w-4 h-4 rounded object-cover" /> : null}
                {kennel.name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasForm && kennel && (
            <Link href={`/form/${kennel.id}`} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition">
              <FileText className="w-4 h-4" /> Pedir info
            </Link>
          )}
          {kennel?.whatsapp_enabled && kennel.whatsapp_phone && (
            <a href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || `Hola, me interesa la camada de ${father?.name || ''} x ${mother?.name || ''}`)}`}
              target="_blank" rel="noopener" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          {isOwner && user && (
            <LitterEditButton
              litterId={id}
              userId={user.id}
              userKennelId={kennel?.id}
              userKennelName={kennel?.name}
              userAffixFormat={kennel?.affix_format}
            />
          )}
        </div>
      </div>

      {/* Timeline + Parents row */}
      <div className="flex gap-4 mb-6">
        {/* Parents compact */}
        <div className="flex gap-2 flex-shrink-0">
          <CompactParent parent={father} role="Padre" />
          <CompactParent parent={mother} role="Madre" />
        </div>

        {/* Visual timeline */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center">
          <div className="flex items-center w-full">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.active ? 'bg-[#D74709] text-white' : 'bg-white/10 text-white/25'}`}>
                    {step.active ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <p className={`text-[10px] font-semibold mt-1 ${step.active ? 'text-[#D74709]' : 'text-white/25'}`}>{step.label}</p>
                  {step.date && step.active && (
                    <p className="text-[9px] text-white/30">{new Date(step.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${steps[i + 1].active ? 'bg-[#D74709]' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
          {/* Extra info */}
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10 flex-shrink-0">
            {litter.puppy_count != null && (
              <div className="text-center">
                <p className="text-lg font-bold">{litter.puppy_count}</p>
                <p className="text-[9px] text-white/30">cachorros</p>
              </div>
            )}
            {isOwner && (
              <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${litter.is_public ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                {litter.is_public ? 'Publica' : 'Privada'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Puppies - compact like dog detail siblings */}
      {puppies.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Baby className="w-3.5 h-3.5" /> Cachorros ({puppies.length})
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {puppies.map((pup: any) => {
              const sc = pup.sex === 'male' ? BRAND.male : BRAND.female
              return (
                <Link key={pup.id} href={`/dogs/${pup.id}`} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:border-[#D74709]/30 transition flex-shrink-0">
                  <div className="w-8 h-8 rounded-full border-2 overflow-hidden bg-white/5 flex-shrink-0" style={{ borderColor: sc }}>
                    {pup.thumbnail_url ? <img src={pup.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/15 text-xs">{pup.sex === 'male' ? '♂' : '♀'}</div>}
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">{pup.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Waiting list — only for owner */}
      {isOwner && <LitterWaitingList litterId={id} isOwner={isOwner} />}

      {/* Pedigree - free, no box */}
      {pedigreeData.length > 1 && pedigreeRootId && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Genealogia</h2>
          <PedigreeTree data={pedigreeData} rootId={pedigreeRootId} />
        </div>
      )}
    </div>
  )
}

function CompactParent({ parent, role }: { parent: any; role: string }) {
  const isFather = role === 'Padre'
  const sc = isFather ? BRAND.male : BRAND.female
  if (!parent) return <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/20 text-sm">{role} ?</div>
  return (
    <Link href={`/dogs/${parent.id}`} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 hover:border-[#D74709] transition group" style={{ borderColor: sc }}>
      {parent.thumbnail_url ? <img src={parent.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center text-2xl" style={{ color: sc + '40' }}>{isFather ? '♂' : '♀'}</div>}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
        <p className="text-[10px] text-white/60">{role}</p>
        <p className="text-xs font-semibold text-white truncate">{parent.name}</p>
      </div>
    </Link>
  )
}
