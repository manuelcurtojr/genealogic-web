import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Baby, Calendar, Eye, EyeOff } from 'lucide-react'
import { BRAND } from '@/lib/constants'

export default async function LittersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: litters } = await supabase
    .from('litters')
    .select(`
      id, birth_date, puppy_count, is_public, status,
      breed:breeds(name),
      father:dogs!litters_father_id_fkey(id, name, sex, thumbnail_url),
      mother:dogs!litters_mother_id_fkey(id, name, sex, thumbnail_url)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const statusConfig: Record<string, { label: string; color: string }> = {
    confirmed: { label: 'Confirmada', color: BRAND.success },
    pending: { label: 'Pendiente', color: BRAND.warning },
    planned: { label: 'Planificada', color: BRAND.info },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Camadas</h1>
          <p className="text-white/50 text-sm mt-1">{litters?.length || 0} camadas</p>
        </div>
        <Link href="/litters/new" className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
          <Plus className="w-4 h-4" /> Nueva camada
        </Link>
      </div>

      {!litters || litters.length === 0 ? (
        <div className="text-center py-20">
          <Baby className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No tienes camadas registradas</p>
          <p className="text-white/25 text-sm mt-2">Crea tu primera camada para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {litters.map((litter: any) => {
            const father = litter.father as any
            const mother = litter.mother as any
            const status = statusConfig[litter.status] || statusConfig.pending

            return (
              <Link key={litter.id} href={`/litters/${litter.id}`}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/50 hover:bg-white/[0.07] transition group">

                {/* Parents photos */}
                <div className="flex h-32">
                  <ParentPhoto parent={father} sex="male" />
                  <div className="w-px bg-white/10" />
                  <ParentPhoto parent={mother} sex="female" />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-white group-hover:text-[#D74709] transition truncate">
                      {father?.name || '?'} × {mother?.name || '?'}
                    </h3>
                    {litter.is_public ? (
                      <Eye className="w-3.5 h-3.5 text-green-400/60 flex-shrink-0" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status badge */}
                    <span className="text-[11px] font-medium rounded-full px-2 py-0.5" style={{ backgroundColor: status.color + '20', color: status.color }}>
                      {status.label}
                    </span>
                    {(litter.breed as any)?.name && (
                      <span className="text-[11px] bg-white/10 text-white/60 rounded-full px-2 py-0.5">
                        {(litter.breed as any).name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    {litter.birth_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(litter.birth_date).toLocaleDateString('es-ES')}
                      </span>
                    )}
                    {litter.puppy_count != null && litter.puppy_count > 0 && (
                      <span>{litter.puppy_count} cachorros</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ParentPhoto({ parent, sex }: { parent: any; sex: string }) {
  const borderColor = sex === 'male' ? BRAND.male : BRAND.female
  return (
    <div className="flex-1 relative bg-white/5 flex items-center justify-center">
      {parent?.thumbnail_url ? (
        <img src={parent.thumbnail_url} alt={parent.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-2xl text-white/10">{sex === 'male' ? '♂' : '♀'}</span>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: borderColor }} />
      {parent && (
        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 backdrop-blur-sm text-white/80 rounded px-1.5 py-0.5 truncate max-w-[90%]">
          {parent.name}
        </span>
      )}
    </div>
  )
}
