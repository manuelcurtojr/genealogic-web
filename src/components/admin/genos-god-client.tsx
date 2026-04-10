'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Store, GitMerge, Loader2, Search, ChevronDown, ChevronRight, Check, AlertTriangle, Trash2 } from 'lucide-react'

interface Props { userId: string }

// Prepositions that separate dog name from kennel name
const PREPOSITIONS = ['de', 'of', 'von', 'du', 'del', 'vom']

function normName(s: string): string {
  return s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[''`']/g, '').replace(/\s+/g, ' ')
}

export default function GenosGodClient({ userId }: Props) {
  const [activeTab, setActiveTab] = useState<'kennels' | 'kennel-dupes' | 'duplicates'>('kennels')

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#D74709]/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#D74709]" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Genos God</h1>
          <p className="text-xs text-white/40">Herramientas de IA para limpiar y organizar la base de datos</p>
        </div>
      </div>

      <div className="flex border-b border-white/10 mb-6">
        <button onClick={() => setActiveTab('kennels')} className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${activeTab === 'kennels' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40 hover:text-white/60'}`}>
          <Store className="w-4 h-4" /> Detector de Criaderos
        </button>
        <button onClick={() => setActiveTab('kennel-dupes')} className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${activeTab === 'kennel-dupes' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40 hover:text-white/60'}`}>
          <Store className="w-4 h-4" /> Criaderos Duplicados
        </button>
        <button onClick={() => setActiveTab('duplicates')} className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${activeTab === 'duplicates' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40 hover:text-white/60'}`}>
          <GitMerge className="w-4 h-4" /> Perros Duplicados
        </button>
      </div>

      {activeTab === 'kennels' ? <KennelDetector /> : activeTab === 'kennel-dupes' ? <KennelDuplicateDetector /> : <DuplicateDetector />}
    </div>
  )
}

// ============================
// TAB 1: KENNEL DETECTOR
// ============================
interface KennelGroup {
  affix: string
  format: string
  preposition: string
  dogs: { id: string; name: string; kennel_id: string | null }[]
  existingKennel: { id: string; name: string; owner_id: string | null } | null
  assignedCount: number
  unassignedCount: number
}

function KennelDetector() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<KennelGroup[]>([])
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [reconciling, setReconciling] = useState<string | null>(null)
  const [reconciledSet, setReconciledSet] = useState<Set<string>>(new Set())

  useEffect(() => { detectKennels() }, [])

  async function detectKennels() {
    setLoading(true)
    const supabase = createClient()

    const { data: dogs } = await supabase.from('dogs').select('id, name, kennel_id').order('name')
    const { data: kennels } = await supabase.from('kennels').select('id, name, owner_id, affix_format')

    const kennelMap = new Map((kennels || []).map(k => [normName(k.name), k]))
    const affixGroups = new Map<string, KennelGroup>()

    for (const dog of (dogs || [])) {
      if (!dog.name) continue
      const name = dog.name.trim()

      // Try to extract kennel affix using prepositions
      for (const prep of PREPOSITIONS) {
        const regex = new RegExp(`\\s+${prep}\\s+(.+)$`, 'i')
        const match = name.match(regex)
        if (match) {
          const affix = match[1].trim()
          const affixNorm = normName(affix)
          if (affixNorm.length < 3) continue // skip very short affixes

          if (!affixGroups.has(affixNorm)) {
            const existing = kennelMap.get(affixNorm) || null
            affixGroups.set(affixNorm, {
              affix,
              format: `suffix_${prep}`,
              preposition: prep,
              dogs: [],
              existingKennel: existing,
              assignedCount: 0,
              unassignedCount: 0,
            })
          }
          const group = affixGroups.get(affixNorm)!
          group.dogs.push(dog)
          if (dog.kennel_id) group.assignedCount++
          else group.unassignedCount++
          break // only match first preposition
        }
      }
    }

    // Sort by dog count desc
    const sorted = [...affixGroups.values()].sort((a, b) => b.dogs.length - a.dogs.length)
    setGroups(sorted)
    setLoading(false)
  }

  async function reconcile(group: KennelGroup) {
    setReconciling(group.affix)
    try {
      const unassigned = group.dogs.filter(d => !d.kennel_id).map(d => d.id)
      if (unassigned.length === 0) { setReconciledSet(prev => new Set(prev).add(group.affix)); setReconciling(null); return }

      const res = await fetch('/api/admin/genos-god', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reconcile-kennel',
          kennelName: group.affix,
          affixFormat: group.format,
          dogIds: unassigned,
          existingKennelId: group.existingKennel?.id || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setReconciledSet(prev => new Set(prev).add(group.affix))
      // Update group counts locally
      group.assignedCount += result.assigned
      group.unassignedCount -= result.assigned
      if (!group.existingKennel) group.existingKennel = { id: result.kennelId, name: group.affix, owner_id: null }
    } catch (err: any) { alert(err.message) }
    setReconciling(null)
  }

  async function reconcileAll() {
    for (const g of filtered) {
      if (g.unassignedCount === 0 || reconciledSet.has(g.affix)) continue
      await reconcile(g)
    }
  }

  const filtered = useMemo(() => {
    if (!search) return groups
    const q = normName(search)
    return groups.filter(g => normName(g.affix).includes(q))
  }, [groups, search])

  const totalUnassigned = filtered.reduce((s, g) => s + g.unassignedCount, 0)

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar criadero..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
        </div>
        <p className="text-xs text-white/40">{filtered.length} criaderos detectados · {totalUnassigned} perros sin asignar</p>
        {totalUnassigned > 0 && (
          <button onClick={reconcileAll} className="ml-auto px-4 py-2 rounded-lg text-xs font-semibold bg-[#D74709] text-white hover:bg-[#c03d07] transition">
            Conciliar todo ({totalUnassigned})
          </button>
        )}
      </div>

      <div className="space-y-1">
        {filtered.map(g => {
          const isExpanded = expanded.has(g.affix)
          const isReconciled = reconciledSet.has(g.affix) || g.unassignedCount === 0
          const isReconciling = reconciling === g.affix

          return (
            <div key={g.affix} className={`border rounded-xl transition ${isReconciled ? 'border-green-500/20 bg-green-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(g.affix) ? n.delete(g.affix) : n.add(g.affix); return n })}>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
                <Store className="w-4 h-4 text-[#D74709]" />
                <span className="text-sm font-semibold flex-1">{g.affix}</span>
                <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">{g.preposition}</span>
                <span className="text-xs text-white/40">{g.dogs.length} perros</span>
                {g.unassignedCount > 0 && <span className="text-xs text-yellow-400">{g.unassignedCount} sin asignar</span>}
                {g.existingKennel && <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Existe</span>}
                {isReconciled ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : isReconciling ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#D74709]" />
                ) : g.unassignedCount > 0 ? (
                  <button onClick={e => { e.stopPropagation(); reconcile(g) }} className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition">
                    Conciliar
                  </button>
                ) : null}
              </div>
              {isExpanded && (
                <div className="border-t border-white/5 px-4 py-2 max-h-60 overflow-y-auto">
                  {g.dogs.map(d => (
                    <div key={d.id} className="flex items-center gap-2 py-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${d.kennel_id ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span className="text-white/60 flex-1 truncate">{d.name}</span>
                      <span className="text-white/20">{d.kennel_id ? 'Asignado' : 'Sin asignar'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================
// TAB 2: DUPLICATE DETECTOR
// ============================
interface DogRow {
  id: string; name: string; sex: string | null; birth_date: string | null
  registration: string | null; microchip: string | null; thumbnail_url: string | null
  owner_id: string | null; contributor_id: string | null
  father_id: string | null; mother_id: string | null
  breed: any; kennel_id: string | null
}

interface DuplicateGroup {
  normalizedName: string
  dogs: DogRow[]
}

// ============================
// TAB 2: KENNEL DUPLICATE DETECTOR
// ============================
interface KennelRow {
  id: string; name: string; owner_id: string | null; slug: string | null
  logo_url: string | null; affix_format: string | null; dogCount: number
}

interface KennelDuplicateGroup {
  normalizedName: string
  kennels: KennelRow[]
}

function KennelDuplicateDetector() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<KennelDuplicateGroup[]>([])
  const [search, setSearch] = useState('')
  const [merging, setMerging] = useState<{ group: KennelDuplicateGroup; keeperId: string } | null>(null)
  const [mergeLoading, setMergeLoading] = useState(false)
  const [mergedNames, setMergedNames] = useState<Set<string>>(new Set())

  useEffect(() => { detect() }, [])

  async function detect() {
    setLoading(true)
    const supabase = createClient()
    const { data: kennels } = await supabase.from('kennels').select('id, name, owner_id, slug, logo_url, affix_format').order('name')
    const { data: dogs } = await supabase.from('dogs').select('id, kennel_id')

    // Count dogs per kennel
    const dogCounts = new Map<string, number>()
    for (const d of (dogs || [])) { if (d.kennel_id) dogCounts.set(d.kennel_id, (dogCounts.get(d.kennel_id) || 0) + 1) }

    const kennelsWithCount = (kennels || []).map(k => ({ ...k, dogCount: dogCounts.get(k.id) || 0 }))

    // Group by normalized name
    const nameGroups = new Map<string, KennelRow[]>()
    for (const k of kennelsWithCount) {
      const norm = normName(k.name)
      if (!nameGroups.has(norm)) nameGroups.set(norm, [])
      nameGroups.get(norm)!.push(k)
    }

    const duplicates: KennelDuplicateGroup[] = []
    for (const [normalizedName, groupKennels] of nameGroups) {
      if (groupKennels.length >= 2) {
        // Sort: most dogs first, then with owner, then with logo
        groupKennels.sort((a, b) => {
          const score = (k: KennelRow) => k.dogCount * 100 + (k.owner_id ? 10 : 0) + (k.logo_url ? 5 : 0) + (k.affix_format ? 2 : 0)
          return score(b) - score(a)
        })
        duplicates.push({ normalizedName, kennels: groupKennels })
      }
    }
    duplicates.sort((a, b) => b.kennels.length - a.kennels.length)
    setGroups(duplicates)
    setLoading(false)
  }

  async function handleMerge() {
    if (!merging) return
    setMergeLoading(true)
    try {
      const keeper = merging.keeperId
      const removeIds = merging.group.kennels.filter(k => k.id !== keeper).map(k => k.id)
      const supabase = createClient()

      for (const removeId of removeIds) {
        // Reassign all dogs from removed kennel to keeper
        await supabase.from('dogs').update({ kennel_id: keeper }).eq('kennel_id', removeId)
        // Reassign litters if any
        await supabase.from('litters').update({ kennel_id: keeper }).eq('kennel_id', removeId)

        // Fill empty fields on keeper from removed kennel
        const { data: keeperK } = await supabase.from('kennels').select('*').eq('id', keeper).single()
        const { data: removeK } = await supabase.from('kennels').select('*').eq('id', removeId).single()
        if (keeperK && removeK) {
          const updates: Record<string, any> = {}
          for (const f of ['owner_id', 'logo_url', 'affix_format', 'description', 'website', 'country', 'city', 'foundation_date']) {
            if (!keeperK[f] && removeK[f]) updates[f] = removeK[f]
          }
          if (Object.keys(updates).length > 0) await supabase.from('kennels').update(updates).eq('id', keeper)
        }

        // Delete removed kennel
        await supabase.from('kennels').delete().eq('id', removeId)
      }

      setMergedNames(prev => new Set(prev).add(merging.group.normalizedName))
      setMerging(null)
    } catch (err: any) { alert(err.message) }
    setMergeLoading(false)
  }

  const filtered = useMemo(() => {
    if (!search) return groups
    const q = normName(search)
    return groups.filter(g => g.normalizedName.includes(q))
  }, [groups, search])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar criadero..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
        </div>
        <p className="text-xs text-white/40">{filtered.length} criaderos duplicados</p>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Check className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
          <p className="text-sm text-white/30">No se detectaron criaderos duplicados</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(g => {
          if (mergedNames.has(g.normalizedName)) return (
            <div key={g.normalizedName} className="border border-green-500/20 bg-green-500/5 rounded-xl p-4 opacity-50">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /><span className="text-sm text-green-400">Fusionado: {g.kennels[0].name}</span></div>
            </div>
          )

          return (
            <div key={g.normalizedName} className="border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold">{g.kennels[0].name}</span>
                <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">{g.kennels.length} duplicados</span>
                <button onClick={() => setMerging({ group: g, keeperId: g.kennels[0].id })} className="ml-auto px-3 py-1 rounded-lg text-[11px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition">
                  <GitMerge className="w-3 h-3 inline mr-1" />Fusionar
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {g.kennels.map((k, i) => (
                  <div key={k.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                      {k.logo_url ? <img src={k.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-4 h-4 text-white/10 m-auto" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{k.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-white/30">
                        <span>{k.dogCount} perros</span>
                        {k.owner_id && <span className="text-green-400">Con propietario</span>}
                        {k.affix_format && <span>{k.affix_format}</span>}
                      </div>
                    </div>
                    {i === 0 && <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Recomendado</span>}
                    <span className="text-[10px] text-white/20 font-mono">{k.id.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Merge modal */}
      {merging && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60" onClick={() => !mergeLoading && setMerging(null)} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-sm font-semibold">Fusionar criaderos</h3>
              <p className="text-xs text-white/40 mt-1">Los perros de los criaderos eliminados se moveran al seleccionado.</p>
            </div>
            <div className="p-5 space-y-2 max-h-60 overflow-y-auto">
              {merging.group.kennels.map(k => (
                <button key={k.id} onClick={() => setMerging({ ...merging, keeperId: k.id })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${merging.keeperId === k.id ? 'border-[#D74709] bg-[#D74709]/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5'}`}>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                    {k.logo_url ? <img src={k.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-white/10 m-auto" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{k.name}</p>
                    <p className="text-[10px] text-white/30">{k.dogCount} perros · {k.owner_id ? 'Con propietario' : 'Sin propietario'}</p>
                  </div>
                  {merging.keeperId === k.id && <Check className="w-5 h-5 text-[#D74709]" />}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/10">
              <button onClick={() => setMerging(null)} disabled={mergeLoading} className="px-4 py-2 rounded-lg text-sm text-white/50 bg-white/5 hover:bg-white/10 transition">Cancelar</button>
              <button onClick={handleMerge} disabled={mergeLoading} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#D74709] text-white hover:bg-[#c03d07] transition disabled:opacity-50 flex items-center gap-2">
                {mergeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
                {mergeLoading ? 'Fusionando...' : `Fusionar (eliminar ${merging.group.kennels.length - 1})`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================
// TAB 3: DOG DUPLICATE DETECTOR
// ============================
function DuplicateDetector() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [search, setSearch] = useState('')
  const [merging, setMerging] = useState<{ group: DuplicateGroup; keeperId: string } | null>(null)
  const [mergeLoading, setMergeLoading] = useState(false)
  const [mergedNames, setMergedNames] = useState<Set<string>>(new Set())

  useEffect(() => { detectDuplicates() }, [])

  async function detectDuplicates() {
    setLoading(true)
    const supabase = createClient()

    const { data: dogs } = await supabase.from('dogs')
      .select('id, name, sex, birth_date, registration, microchip, thumbnail_url, owner_id, contributor_id, father_id, mother_id, kennel_id, breed:breeds(name)')
      .order('name')

    // Group by normalized name
    const nameGroups = new Map<string, DogRow[]>()
    for (const dog of (dogs || [])) {
      const norm = normName(dog.name)
      if (!nameGroups.has(norm)) nameGroups.set(norm, [])
      nameGroups.get(norm)!.push(dog)
    }

    // Only keep groups with 2+ dogs
    const duplicates: DuplicateGroup[] = []
    for (const [normalizedName, groupDogs] of nameGroups) {
      if (groupDogs.length >= 2) {
        // Sort: most complete first (more fields filled = better candidate to keep)
        groupDogs.sort((a, b) => {
          const score = (d: DogRow) => [d.registration, d.microchip, d.birth_date, d.thumbnail_url, d.father_id, d.mother_id, d.owner_id, d.kennel_id].filter(Boolean).length
          return score(b) - score(a)
        })
        duplicates.push({ normalizedName, dogs: groupDogs })
      }
    }

    duplicates.sort((a, b) => b.dogs.length - a.dogs.length)
    setGroups(duplicates)
    setLoading(false)
  }

  async function handleMerge() {
    if (!merging) return
    setMergeLoading(true)
    const removeIds = merging.group.dogs.filter(d => d.id !== merging.keeperId).map(d => d.id)

    try {
      for (const removeId of removeIds) {
        const res = await fetch('/api/admin/genos-god', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'merge-dogs', keeperId: merging.keeperId, removeId }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error)
      }
      setMergedNames(prev => new Set(prev).add(merging.group.normalizedName))
      setMerging(null)
    } catch (err: any) { alert(err.message) }
    setMergeLoading(false)
  }

  const filtered = useMemo(() => {
    if (!search) return groups
    const q = normName(search)
    return groups.filter(g => g.normalizedName.includes(q))
  }, [groups, search])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar duplicado..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
        </div>
        <p className="text-xs text-white/40">{filtered.length} grupos de duplicados detectados</p>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Check className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
          <p className="text-sm text-white/30">No se detectaron duplicados</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(g => {
          const isMerged = mergedNames.has(g.normalizedName)
          if (isMerged) return (
            <div key={g.normalizedName} className="border border-green-500/20 bg-green-500/5 rounded-xl p-4 opacity-50">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Fusionado: {g.dogs[0].name}</span>
              </div>
            </div>
          )

          return (
            <div key={g.normalizedName} className="border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold">{g.dogs[0].name}</span>
                <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">{g.dogs.length} duplicados</span>
                <button onClick={() => setMerging({ group: g, keeperId: g.dogs[0].id })} className="ml-auto px-3 py-1 rounded-lg text-[11px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition">
                  <GitMerge className="w-3 h-3 inline mr-1" />Fusionar
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {g.dogs.map((d, i) => {
                  const breedName = Array.isArray(d.breed) ? d.breed[0]?.name : d.breed?.name
                  const fields = [d.registration, d.microchip, d.birth_date, d.thumbnail_url, d.father_id, d.mother_id, d.owner_id, d.kennel_id].filter(Boolean).length
                  return (
                    <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                        {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/10 text-xs">{d.sex === 'male' ? '♂' : '♀'}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-white/30">
                          {breedName && <span>{breedName}</span>}
                          {d.birth_date && <span>{d.birth_date}</span>}
                          {d.registration && <span>{d.registration}</span>}
                          <span>{fields}/8 campos</span>
                        </div>
                      </div>
                      {i === 0 && <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Recomendado</span>}
                      <span className="text-[10px] text-white/20 font-mono">{d.id.slice(0, 8)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Merge modal */}
      {merging && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60" onClick={() => !mergeLoading && setMerging(null)} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-sm font-semibold">Fusionar duplicados</h3>
              <p className="text-xs text-white/40 mt-1">Selecciona el perro que se quedara. Los demas se eliminaran y sus datos se moveran al seleccionado.</p>
            </div>
            <div className="p-5 space-y-2 max-h-60 overflow-y-auto">
              {merging.group.dogs.map(d => (
                <button key={d.id} onClick={() => setMerging({ ...merging, keeperId: d.id })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${merging.keeperId === d.id ? 'border-[#D74709] bg-[#D74709]/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/5'}`}>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                    {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-[10px] text-white/30">{d.registration || 'Sin registro'} · {d.birth_date || 'Sin fecha'}</p>
                  </div>
                  {merging.keeperId === d.id && <Check className="w-5 h-5 text-[#D74709]" />}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/10">
              <button onClick={() => setMerging(null)} disabled={mergeLoading} className="px-4 py-2 rounded-lg text-sm text-white/50 bg-white/5 hover:bg-white/10 transition">Cancelar</button>
              <button onClick={handleMerge} disabled={mergeLoading} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#D74709] text-white hover:bg-[#c03d07] transition disabled:opacity-50 flex items-center gap-2">
                {mergeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
                {mergeLoading ? 'Fusionando...' : `Fusionar (eliminar ${merging.group.dogs.length - 1})`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
