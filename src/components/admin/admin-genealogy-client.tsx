'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, GitBranch, AlertTriangle, Check, Plus, X, Loader2, Dog as DogIcon, Link2 } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import PedigreeTree from '@/components/pedigree/pedigree-tree'

interface Props {
  dogs: any[]
  allDogs: any[]
  breeds: any[]
  colors: any[]
  userId: string
}

export default function AdminGenealogyClient({ dogs, allDogs, breeds, colors, userId }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'incomplete' | 'no-parents' | 'all'>('incomplete')
  const [selectedDog, setSelectedDog] = useState<any>(null)
  const [pedigreeData, setPedigreeData] = useState<any[]>([])
  const [loadingPedigree, setLoadingPedigree] = useState(false)

  // Form state for adding ancestor
  const [addingFor, setAddingFor] = useState<{ dogId: string; role: 'father' | 'mother' } | null>(null)
  const [ancestorMode, setAncestorMode] = useState<'existing' | 'new'>('existing')
  const [ancestorSearch, setAncestorSearch] = useState('')
  const [newAncestor, setNewAncestor] = useState({ name: '', sex: 'male' as string, breed_id: '', color_id: '' })
  const [saving, setSaving] = useState(false)

  const filtered = dogs.filter(d => {
    if (filter === 'incomplete') return d.completeness < 100
    if (filter === 'no-parents') return d.missingParents > 0
    return true
  }).filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || (d.breed?.name || '').toLowerCase().includes(q)
  }).sort((a, b) => a.completeness - b.completeness)

  const loadPedigree = async (dog: any) => {
    setSelectedDog(dog)
    setLoadingPedigree(true)
    const supabase = createClient()
    const { data } = await supabase.rpc('get_pedigree', { dog_uuid: dog.id, max_gen: 5 })
    setPedigreeData(data || [])
    setLoadingPedigree(false)
  }

  const startAddAncestor = (dogId: string, role: 'father' | 'mother') => {
    setAddingFor({ dogId, role })
    setAncestorMode('existing')
    setAncestorSearch('')
    setNewAncestor({ name: '', sex: role === 'father' ? 'male' : 'female', breed_id: selectedDog?.breed?.id || '', color_id: '' })
  }

  const linkExisting = async (ancestorId: string) => {
    if (!addingFor) return
    setSaving(true)
    const supabase = createClient()
    const field = addingFor.role === 'father' ? 'father_id' : 'mother_id'
    await supabase.from('dogs').update({ [field]: ancestorId }).eq('id', addingFor.dogId)
    setSaving(false)
    setAddingFor(null)
    // Reload pedigree
    if (selectedDog) loadPedigree(selectedDog)
  }

  const createAndLink = async () => {
    if (!addingFor || !newAncestor.name.trim()) return
    setSaving(true)
    const supabase = createClient()

    // Create the new dog (ancestor)
    const { data: created, error } = await supabase.from('dogs').insert({
      name: newAncestor.name.trim(),
      sex: newAncestor.sex,
      breed_id: newAncestor.breed_id || null,
      color_id: newAncestor.color_id || null,
      owner_id: userId,
      is_public: false,
    }).select('id').single()

    if (created) {
      const field = addingFor.role === 'father' ? 'father_id' : 'mother_id'
      await supabase.from('dogs').update({ [field]: created.id }).eq('id', addingFor.dogId)
    }

    setSaving(false)
    setAddingFor(null)
    if (selectedDog) loadPedigree(selectedDog)
  }

  const ancestorCandidates = allDogs.filter(d => {
    if (!addingFor) return false
    const expectedSex = addingFor.role === 'father' ? 'male' : 'female'
    if (d.sex !== expectedSex) return false
    if (d.id === addingFor.dogId) return false
    if (!ancestorSearch) return true
    return d.name.toLowerCase().includes(ancestorSearch.toLowerCase())
  }).slice(0, 20)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Completador de genealogías</h1>
      <p className="text-white/40 text-sm mb-6">Encuentra perros con pedigrí incompleto y rellena los huecos</p>

      <div className="flex gap-4">
        {/* Left: Dog list */}
        <div className="w-[400px] flex-shrink-0 flex flex-col">
          <div className="flex gap-2 mb-3">
            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {[
                { key: 'incomplete', label: 'Incompletos' },
                { key: 'no-parents', label: 'Sin padres' },
                { key: 'all', label: 'Todos' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key as any)}
                  className={`px-3 py-1.5 text-[10px] font-medium transition ${filter === f.key ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/40 hover:text-white/60'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-white/30 self-center">{filtered.length} perros</span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar perro..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[65vh] space-y-1">
            {filtered.map(d => {
              const sexColor = d.sex === 'male' ? BRAND.male : BRAND.female
              const isSelected = selectedDog?.id === d.id
              return (
                <button key={d.id} onClick={() => loadPedigree(d)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition ${
                    isSelected ? 'bg-[#D74709]/10 border border-[#D74709]/30' : 'bg-white/[0.02] border border-transparent hover:bg-white/5'
                  }`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 border flex-shrink-0" style={{ borderColor: sexColor }}>
                    {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-white/15 text-[10px]">{d.sex === 'male' ? '♂' : '♀'}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{d.name}</p>
                    <p className="text-[10px] text-white/30 truncate">{(d.breed as any)?.name || '—'} · {(d.owner as any)?.display_name || '—'}</p>
                  </div>
                  {/* Completeness bar */}
                  <div className="w-12 flex-shrink-0">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${d.completeness}%`,
                        background: d.completeness === 100 ? '#10B981' : d.completeness > 50 ? '#F59E0B' : '#EF4444'
                      }} />
                    </div>
                    <p className="text-[9px] text-white/30 text-center mt-0.5">{d.completeness}%</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Pedigree + editor */}
        <div className="flex-1 min-w-0">
          {!selectedDog ? (
            <div className="flex items-center justify-center h-[60vh] text-white/20">
              <div className="text-center">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Selecciona un perro para ver y completar su genealogía</p>
              </div>
            </div>
          ) : loadingPedigree ? (
            <div className="flex items-center justify-center h-[60vh]">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          ) : (
            <div>
              {/* Selected dog header */}
              <div className="flex items-center gap-3 mb-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border-2 flex-shrink-0" style={{ borderColor: selectedDog.sex === 'male' ? BRAND.male : BRAND.female }}>
                  {selectedDog.thumbnail_url ? <img src={selectedDog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{selectedDog.name}</p>
                  <p className="text-[10px] text-white/30">{(selectedDog.breed as any)?.name} · {selectedDog.filledAncestors}/{selectedDog.totalSlots} ancestros</p>
                </div>
                {/* Quick buttons to add missing parents */}
                {!selectedDog.father_id && (
                  <button onClick={() => startAddAncestor(selectedDog.id, 'father')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition">
                    <Plus className="w-3 h-3" /> Padre
                  </button>
                )}
                {!selectedDog.mother_id && (
                  <button onClick={() => startAddAncestor(selectedDog.id, 'mother')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 text-xs font-medium hover:bg-pink-500/20 transition">
                    <Plus className="w-3 h-3" /> Madre
                  </button>
                )}
              </div>

              {/* Add ancestor panel */}
              {addingFor && (
                <div className="bg-white/5 border border-[#D74709]/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">
                      Añadir {addingFor.role === 'father' ? 'padre' : 'madre'} a {allDogs.find(d => d.id === addingFor.dogId)?.name || '?'}
                    </p>
                    <button onClick={() => setAddingFor(null)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>

                  {/* Mode tabs */}
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setAncestorMode('existing')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${ancestorMode === 'existing' ? 'bg-[#D74709]/15 text-[#D74709]' : 'bg-white/5 text-white/40'}`}>
                      <Link2 className="w-3 h-3 inline mr-1" /> Vincular existente
                    </button>
                    <button onClick={() => setAncestorMode('new')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${ancestorMode === 'new' ? 'bg-[#D74709]/15 text-[#D74709]' : 'bg-white/5 text-white/40'}`}>
                      <Plus className="w-3 h-3 inline mr-1" /> Crear nuevo
                    </button>
                  </div>

                  {ancestorMode === 'existing' ? (
                    <div>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input type="text" value={ancestorSearch} onChange={e => setAncestorSearch(e.target.value)}
                          placeholder={`Buscar ${addingFor.role === 'father' ? 'macho' : 'hembra'}...`} autoFocus
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {ancestorCandidates.map(d => (
                          <button key={d.id} onClick={() => linkExisting(d.id)} disabled={saving}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:bg-white/5 transition text-left disabled:opacity-50">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-white/5 border flex-shrink-0" style={{ borderColor: d.sex === 'male' ? BRAND.male : BRAND.female }}>
                              {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                            </div>
                            <span className="truncate flex-1">{d.name}</span>
                            {(d.breed as any)?.name && <span className="text-[10px] text-white/20">{(d.breed as any).name}</span>}
                          </button>
                        ))}
                        {ancestorCandidates.length === 0 && <p className="text-[10px] text-white/20 text-center py-3">Sin resultados</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input type="text" value={newAncestor.name} onChange={e => setNewAncestor(p => ({ ...p, name: e.target.value }))}
                        placeholder="Nombre del ancestro *" autoFocus
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
                      <div className="grid grid-cols-2 gap-3">
                        <select value={newAncestor.breed_id} onChange={e => setNewAncestor(p => ({ ...p, breed_id: e.target.value }))}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/60 focus:border-[#D74709] focus:outline-none appearance-none">
                          <option value="">Sin raza</option>
                          {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <select value={newAncestor.color_id} onChange={e => setNewAncestor(p => ({ ...p, color_id: e.target.value }))}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/60 focus:border-[#D74709] focus:outline-none appearance-none">
                          <option value="">Sin color</option>
                          {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <button onClick={createAndLink} disabled={saving || !newAncestor.name.trim()}
                        className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1.5">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {saving ? 'Creando...' : 'Crear y vincular'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pedigree tree */}
              {pedigreeData.length > 0 ? (
                <PedigreeTree data={pedigreeData} rootId={selectedDog.id} />
              ) : (
                <div className="text-center py-12 text-white/20">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin datos de pedigrí — añade padre y madre para comenzar</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
