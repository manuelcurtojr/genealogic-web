import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Baby, Calendar, Eye, EyeOff } from 'lucide-react'

export default async function LittersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: litters } = await supabase
    .from('litters')
    .select(`
      id, birth_date, puppy_count, is_public, status,
      breed:breeds(name),
      father:dogs!litters_father_id_fkey(id, name),
      mother:dogs!litters_mother_id_fkey(id, name)
    `)
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

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
        </div>
      ) : (
        <div className="space-y-3">
          {litters.map((litter: any) => (
            <Link key={litter.id} href={`/litters/${litter.id}`}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#D74709]/50 hover:bg-white/[0.07] transition">
              <Baby className="w-10 h-10 text-[#D74709]/50 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">
                    {(litter.father as any)?.name || '?'} x {(litter.mother as any)?.name || '?'}
                  </span>
                  {litter.is_public ? (
                    <Eye className="w-3.5 h-3.5 text-green-400/60" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-white/30" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  {(litter.breed as any)?.name && <span>{(litter.breed as any).name}</span>}
                  {litter.birth_date && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{litter.birth_date}</span>
                  )}
                  {litter.puppy_count != null && <span>{litter.puppy_count} cachorros</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
