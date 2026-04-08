'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Store, Dog, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import AdminKennelPanel from './admin-kennel-panel'

interface Props { kennels: any[] }

export default function AdminKennelsClient({ kennels: initKennels }: Props) {
  const [kennels, setKennels] = useState(initKennels)
  const [search, setSearch] = useState('')
  const [panelKennelId, setPanelKennelId] = useState<string | null>(null)

  const filtered = kennels.filter(k => {
    if (!search) return true
    const q = search.toLowerCase()
    return k.name.toLowerCase().includes(q) || ((k.owner as any)?.display_name || '').toLowerCase().includes(q) || ((k.owner as any)?.email || '').toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Criaderos</h1>
          <p className="text-white/40 text-sm">{kennels.length} criaderos registrados</p>
        </div>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar criadero o propietario..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Criadero</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Propietario</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Perros</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Formato afijo</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Registro</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(k => {
              const owner = k.owner as any
              return (
                <tr key={k.id} className="border-b border-white/5 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => setPanelKennelId(k.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                        {k.logo_url ? <img src={k.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-4 h-4 text-white/20" />}
                      </div>
                      <span className="text-sm font-medium">{k.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-white/60">{owner?.display_name || '—'}</p>
                    <p className="text-[10px] text-white/30">{owner?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium flex items-center gap-1"><Dog className="w-3 h-3 text-white/30" /> {k.dog_count}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">{k.affix_format || '—'}</td>
                  <td className="px-4 py-3 text-[10px] text-white/30">
                    {new Date(k.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/kennels/${k.id}`} target="_blank" className="text-[#D74709] hover:text-[#c03d07] transition">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-white/30 text-sm">Sin resultados</p>}
      </div>

      <AdminKennelPanel
        open={!!panelKennelId}
        onClose={() => setPanelKennelId(null)}
        onSaved={async () => {
          const supabase = createClient()
          const { data } = await supabase.from('kennels').select('id, name, logo_url, description, website, owner_id, created_at, affix_format').order('created_at', { ascending: false })
          const ownerIds = [...new Set((data || []).map(k => k.owner_id).filter(Boolean))]
          const { data: owners } = ownerIds.length > 0 ? await supabase.from('profiles').select('id, display_name, email').in('id', ownerIds) : { data: [] }
          const ownerMap = new Map((owners || []).map(p => [p.id, p]))
          const { data: dogCounts } = await supabase.from('dogs').select('kennel_id').in('kennel_id', (data || []).map(k => k.id))
          const countMap: Record<string, number> = {}
          ;(dogCounts || []).forEach((d: any) => { countMap[d.kennel_id] = (countMap[d.kennel_id] || 0) + 1 })
          setKennels((data || []).map(k => ({ ...k, owner: ownerMap.get(k.owner_id) || null, dog_count: countMap[k.id] || 0 })))
        }}
        kennelId={panelKennelId}
      />
    </div>
  )
}
