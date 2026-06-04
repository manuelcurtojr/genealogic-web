'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Store, Dog, ExternalLink, EyeOff } from 'lucide-react'
import Link from 'next/link'
import AdminKennelPanel from './admin-kennel-panel'
import { Img } from '@/components/ui/img'

interface Props { kennels: any[] }

export default function AdminKennelsClient({ kennels: initKennels }: Props) {
  const [kennels, setKennels] = useState(initKennels)
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState<'visible' | 'hidden' | 'all'>('visible')
  const [panelKennelId, setPanelKennelId] = useState<string | null>(null)

  const filtered = kennels.filter(k => {
    if (visibility === 'visible' && k.hidden_at) return false
    if (visibility === 'hidden' && !k.hidden_at) return false
    if (!search) return true
    const q = search.toLowerCase()
    return k.name.toLowerCase().includes(q) || ((k.owner as any)?.display_name || '').toLowerCase().includes(q) || ((k.owner as any)?.email || '').toLowerCase().includes(q)
  })

  const hiddenCount = kennels.filter(k => k.hidden_at).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Criaderos</h1>
          <p className="text-muted text-sm">{kennels.length} criaderos registrados</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar criadero o propietario..."
            className="w-full bg-canvas border border-hairline rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition" />
        </div>
        <select
          value={visibility}
          onChange={e => setVisibility(e.target.value as 'visible' | 'hidden' | 'all')}
          className="bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none appearance-none cursor-pointer"
          title="Filtrar por visibilidad"
        >
          <option value="visible">Solo visibles</option>
          <option value="hidden">Solo ocultos {hiddenCount > 0 ? `(${hiddenCount})` : ''}</option>
          <option value="all">Todos</option>
        </select>
      </div>

      <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">Criadero</th>
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">Propietario</th>
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">Perros</th>
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">Formato afijo</th>
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">Registro</th>
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(k => {
              const owner = k.owner as any
              return (
                <tr key={k.id} className={`border-b border-hairline hover:bg-surface-card transition cursor-pointer ${k.hidden_at ? 'bg-red-50/30' : ''}`} onClick={() => setPanelKennelId(k.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg overflow-hidden bg-surface-card border border-hairline flex-shrink-0 flex items-center justify-center ${k.hidden_at ? 'grayscale opacity-50' : ''}`}>
                        {k.logo_url ? <Img w={120} src={k.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-4 h-4 text-muted" />}
                      </div>
                      <span className="text-sm font-medium">{k.name}</span>
                      {k.hidden_at && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          title={`Oculto desde ${new Date(k.hidden_at).toLocaleDateString('es-ES')} · Motivo: ${k.hidden_reason || '—'}`}
                        >
                          <EyeOff className="w-2.5 h-2.5" />
                          Oculto
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-body">{owner?.display_name || '—'}</p>
                    <p className="text-[10px] text-muted">{owner?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium flex items-center gap-1"><Dog className="w-3 h-3 text-muted" /> {k.dog_count}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{k.affix_format || '—'}</td>
                  <td className="px-4 py-3 text-[10px] text-muted">
                    {new Date(k.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Vista 360 admin (interna) */}
                      <Link
                        href={`/admin/kennels/${k.id}`}
                        title="Ver 360"
                        className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2 py-1 text-[10.5px] font-semibold text-body hover:text-ink hover:border-ink/30 transition"
                      >
                        360 →
                      </Link>
                      {/* Web pública del kennel (target=_blank) */}
                      <Link href={`/kennels/${k.id}`} target="_blank" className="text-ink hover:opacity-80 transition" title="Ver web pública">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-muted text-sm">Sin resultados</p>}
      </div>

      <AdminKennelPanel
        open={!!panelKennelId}
        onClose={() => setPanelKennelId(null)}
        onSaved={async () => {
          const supabase = createClient()
          const { data } = await supabase.from('kennels').select('id, name, logo_url, description, website, owner_id, created_at, affix_format, hidden_at, hidden_reason').order('created_at', { ascending: false })
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
