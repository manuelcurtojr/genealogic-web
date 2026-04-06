import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, Baby, Eye, EyeOff, Trash2 } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import LitterDetailActions from '@/components/litters/litter-detail-actions'

export default async function LitterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

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

  const isOwner = user.id === litter.owner_id
  const father = litter.father as any
  const mother = litter.mother as any

  const statusConfig: Record<string, { label: string; color: string }> = {
    confirmed: { label: 'Confirmada', color: BRAND.success },
    pending: { label: 'Pendiente', color: BRAND.warning },
    planned: { label: 'Planificada', color: BRAND.info },
  }
  const status = statusConfig[litter.status] || statusConfig.pending

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/litters" className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {father?.name || '?'} × {mother?.name || '?'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium rounded-full px-2.5 py-0.5" style={{ backgroundColor: status.color + '20', color: status.color }}>
              {status.label}
            </span>
            {(litter.breed as any)?.name && (
              <span className="text-xs bg-white/10 text-white/60 rounded-full px-2.5 py-0.5">
                {(litter.breed as any).name}
              </span>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Link
              href={`/litters/${id}/edit`}
              className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
            >
              <Edit className="w-4 h-4" /> Editar
            </Link>
            <LitterDetailActions litterId={id} />
          </div>
        )}
      </div>

      {/* Parents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ParentCard parent={father} role="Padre" />
        <ParentCard parent={mother} role="Madre" />
      </div>

      {/* Info */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Informacion</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCell icon={Calendar} label="Fecha de nacimiento" value={litter.birth_date ? new Date(litter.birth_date).toLocaleDateString('es-ES') : '—'} />
          <InfoCell icon={Baby} label="Cachorros" value={litter.puppy_count != null ? `${litter.puppy_count}` : '—'} />
          <InfoCell icon={litter.is_public ? Eye : EyeOff} label="Visibilidad" value={litter.is_public ? 'Publica' : 'Privada'} />
          <InfoCell icon={Calendar} label="Creada" value={new Date(litter.created_at).toLocaleDateString('es-ES')} />
        </div>
      </div>
    </div>
  )
}

function ParentCard({ parent, role }: { parent: any; role: string }) {
  const isFather = role === 'Padre'
  const sexColor = isFather ? BRAND.male : BRAND.female

  if (!parent) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
        <p className="text-white/30 text-sm">{role} desconocido</p>
      </div>
    )
  }

  return (
    <Link href={`/dogs/${parent.id}`} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/50 transition flex">
      <div className="w-24 h-24 flex-shrink-0 bg-white/5 relative">
        {parent.thumbnail_url ? (
          <img src={parent.thumbnail_url} alt={parent.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10 text-2xl">
            {isFather ? '♂' : '♀'}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: sexColor }} />
      </div>
      <div className="p-4 flex-1 min-w-0">
        <p className="text-xs text-white/40 mb-1">{role}</p>
        <p className="font-semibold text-sm text-white truncate">{parent.name}</p>
        {parent.breed?.name && (
          <p className="text-xs text-white/40 mt-1">{parent.breed.name}</p>
        )}
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
        <p className="text-sm text-white font-medium">{value}</p>
      </div>
    </div>
  )
}
