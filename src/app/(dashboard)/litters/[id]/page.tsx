import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Baby, Check, Circle } from 'lucide-react'
import WhatsAppIcon from '@/components/ui/whatsapp-icon'
import { BRAND } from '@/lib/constants'
import PedigreeTree from '@/components/pedigree/pedigree-tree'
import LitterEditButton from '@/components/litters/litter-edit-button'

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

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name, logo_url, whatsapp_enabled, whatsapp_phone, whatsapp_text, affix_format')
    .eq('owner_id', litter.owner_id).limit(1)
  const kennel = kennelArr?.[0]

  let puppies: any[] = []
  if (father?.id && mother?.id) {
    const { data } = await supabase
      .from('dogs')
      .select('id, name, sex, thumbnail_url, slug')
      .eq('father_id', father.id).eq('mother_id', mother.id).order('name')
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
    pedigreeData.push({
      id: virtualRootId,
      name: 'Camada',
      sex: 'male',
      registration: null,
      father_id: father.id,
      mother_id: mother.id,
      generation: 0,
      photo_url: null,
      breed_name: breedName,
      color_name: null,
    })
    const seen = new Set([virtualRootId])
    for (const d of [...(fatherPed.data || []), ...(motherPed.data || [])]) {
      if (!seen.has(d.id)) { pedigreeData.push({ ...d, generation: d.generation + 1 }); seen.add(d.id) }
    }
  }

  const steps = [
    { key: 'planned', label: 'Planificada', date: litter.created_at, active: true },
    { key: 'mated', label: 'Cubrición', date: litter.mating_date, active: ['mated', 'born', 'confirmed'].includes(litter.status) },
    { key: 'born', label: 'Nacimiento', date: litter.birth_date, active: ['born', 'confirmed'].includes(litter.status) },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/litters" className="mt-2 flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Camada</p>
            <h1 className="mt-1 text-[28px] sm:text-[36px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
              {father?.name || '?'} × {mother?.name || '?'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {breedName && (
                <span className="inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-0.5 text-[12px] font-medium text-body">
                  {breedName}
                </span>
              )}
              {kennel && (
                <Link
                  href={`/kennels/${kennel.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-0.5 text-[12px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
                >
                  {kennel.logo_url && <img src={kennel.logo_url} alt="" className="h-4 w-4 rounded-full object-cover" />}
                  {kennel.name}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {kennel?.whatsapp_enabled && kennel.whatsapp_phone && (
            <a
              href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || `Hola, me interesa la camada de ${father?.name || ''} x ${mother?.name || ''}`)}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90"
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
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

      {/* Parents + Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
        <div className="flex gap-2">
          <CompactParent parent={father} role="Padre" />
          <CompactParent parent={mother} role="Madre" />
        </div>

        <div className="flex items-center gap-6 rounded-xl border border-hairline bg-canvas p-5">
          <div className="flex flex-1 items-center">
            {steps.map((step, i) => (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    step.active ? 'bg-ink text-on-primary' : 'bg-surface-card text-muted'
                  }`}>
                    {step.active ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </div>
                  <p className={`mt-2 text-[11px] font-medium ${step.active ? 'text-ink' : 'text-muted'}`}>
                    {step.label}
                  </p>
                  {step.date && step.active && (
                    <p className="text-[10px] text-muted">
                      {new Date(step.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </p>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={`mx-2 h-px flex-1 ${steps[i + 1].active ? 'bg-ink' : 'bg-hairline'}`} />
                )}
              </div>
            ))}
          </div>
          {(litter.puppy_count != null || isOwner) && (
            <div className="flex items-center gap-4 border-l border-hairline pl-6">
              {litter.puppy_count != null && (
                <div className="text-center">
                  <p className="text-[24px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-none">
                    {litter.puppy_count}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.06em] text-muted">cachorros</p>
                </div>
              )}
              {isOwner && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  litter.is_public
                    ? 'bg-[color:var(--success)]/10 text-[color:var(--success)]'
                    : 'bg-surface-card text-muted'
                }`}>
                  {litter.is_public ? 'Pública' : 'Privada'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Puppies */}
      {puppies.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[22px] font-semibold tracking-[-0.04em] text-ink">
            <Baby className="h-5 w-5 text-muted" /> Cachorros
            <span className="text-[13px] font-normal text-muted">({puppies.length})</span>
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {puppies.map((pup: any) => {
              const sc = pup.sex === 'male' ? BRAND.male : BRAND.female
              return (
                <Link
                  key={pup.id}
                  href={`/dogs/${pup.slug || pup.id}`}
                  className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2 transition-colors hover:bg-surface-soft"
                >
                  <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border-2 bg-surface-card" style={{ borderColor: sc }}>
                    {pup.thumbnail_url
                      ? <img src={pup.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-[12px] text-muted">{pup.sex === 'male' ? '♂' : '♀'}</div>
                    }
                  </div>
                  <span className="whitespace-nowrap text-[13px] font-medium text-ink">{pup.name}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Genealogía — full bleed en pantallas anchas (rompe max-w-7xl
          del dashboard layout). Ver dogs/[id]/page.tsx para el motivo. */}
      {pedigreeData.length > 1 && pedigreeRootId && (
        <section className="-mx-4 sm:-mx-[30px] lg:mx-[calc(50%-50vw)] lg:px-6">
          <h2 className="mb-4 px-4 sm:px-[30px] lg:px-2 text-[22px] font-semibold tracking-[-0.04em] text-ink">
            Genealogía
          </h2>
          <PedigreeTree data={pedigreeData} rootId={pedigreeRootId} />
        </section>
      )}
    </div>
  )
}

function CompactParent({ parent, role }: { parent: any; role: string }) {
  const isFather = role === 'Padre'
  const sc = isFather ? BRAND.male : BRAND.female
  if (!parent) return (
    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface-soft text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted">{role}</p>
      <p className="mt-1 text-[12px] text-body">Desconocido</p>
    </div>
  )
  return (
    <Link
      href={`/dogs/${parent.slug || parent.id}`}
      className="group relative h-28 w-28 overflow-hidden rounded-xl border-2 transition-opacity hover:opacity-95"
      style={{ borderColor: sc }}
    >
      {parent.thumbnail_url
        ? <img src={parent.thumbnail_url} alt="" className="h-full w-full object-cover" />
        : <div className="flex h-full w-full items-center justify-center bg-surface-card text-3xl" style={{ color: sc + '60' }}>{isFather ? '♂' : '♀'}</div>
      }
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-2 pb-2 pt-6">
        <p className="text-[9px] font-medium uppercase tracking-[0.06em] text-white/80">{role}</p>
        <p className="truncate text-[12px] font-semibold text-white">{parent.name}</p>
      </div>
    </Link>
  )
}
