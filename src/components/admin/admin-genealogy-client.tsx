'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, GitBranch, AlertTriangle, Loader2, PanelLeftClose, PanelLeftOpen, X, Plus, Link2, Unlink, Check } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import AdminPedigreeTree from './admin-pedigree-tree'

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
  const [listCollapsed, setListCollapsed] = useState(false)

  // Ancestor panel state
  const [ancestorPanel, setAncestorPanel] = useState<{ dogId: string; role: 'father' | 'mother'; dogName: string } | null>(null)
  const [ancestorMode, setAncestorMode] = useState<'existing' | 'new'>('existing')
  const [ancestorSearch, setAncestorSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [newAncestor, setNewAncestor] = useState({ name: '', breed_id: '', color_id: '' })

  // Edit panel state (click on existing node)
  const [editPanel, setEditPanel] = useState<{ dogId: string; parentDogId: string | null; role: 'father' | 'mother' | null } | null>(null)

  const filtered = dogs.filter(d => {
    if (filter === 'incomplete') return d.completeness < 100
    if (filter === 'no-parents') return d.missingParents > 0
    return true
  }).filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || (d.breed?.name || '').toLowerCase().includes(q)
  }).sort((a, b) => a.completeness - b.completeness)

  const loadPedigree = useCallback(async (dog: any) => {
    setSelectedDog(dog)
    setLoadingPedigree(true)
    setAncestorPanel(null)
    setEditPanel(null)
    const supabase = createClient()
    const { data } = await supabase.rpc('get_pedigree', { dog_uuid: dog.id, max_gen: 10 })
    setPedigreeData(data || [])
    setLoadingPedigree(false)
  }, [])

  const reloadPedigree = useCallback(async () => {
    if (!selectedDog) return
    const supabase = createClient()
    const { data } = await supabase.rpc('get_pedigree', { dog_uuid: selectedDog.id, max_gen: 10 })
    setPedigreeData(data || [])
  }, [selectedDog])

  // Click empty slot → open ancestor panel
  const handleClickEmpty = (parentDogId: string, role: 'father' | 'mother') => {
    const parentNode = pedigreeData.find(n => n.id === parentDogId)
    setAncestorPanel({ dogId: parentDogId, role, dogName: parentNode?.name || '?' })
    setAncestorMode('existing')
    setAncestorSearch('')
    setNewAncestor({ name: '', breed_id: '', color_id: '' })
    setEditPanel(null)
  }

  // Click filled node → open edit/disconnect panel
  const handleClickDog = (dogId: string) => {
    // Find which parent slot this dog occupies
    const parentNode = pedigreeData.find(n => n.father_id === dogId || n.mother_id === dogId)
    const role = parentNode?.father_id === dogId ? 'father' as const : parentNode?.mother_id === dogId ? 'mother' as const : null
    setEditPanel({ dogId, parentDogId: parentNode?.id || null, role })
    setAncestorPanel(null)
  }

  // Link existing dog as parent
  const linkExisting = async (ancestorId: string) => {
    if (!ancestorPanel) return
    setSaving(true)
    const supabase = createClient()
    const field = ancestorPanel.role === 'father' ? 'father_id' : 'mother_id'
    await supabase.from('dogs').update({ [field]: ancestorId }).eq('id', ancestorPanel.dogId)
    setSaving(false)
    setAncestorPanel(null)
    reloadPedigree()
  }

  // Create new dog and link as parent
  const createAndLink = async () => {
    if (!ancestorPanel || !newAncestor.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const childDog = allDogs.find(d => d.id === ancestorPanel.dogId)
    const sex = ancestorPanel.role === 'father' ? 'male' : 'female'

    const { data: created } = await supabase.from('dogs').insert({
      name: newAncestor.name.trim(),
      sex,
      breed_id: newAncestor.breed_id || null,
      color_id: newAncestor.color_id || null,
      owner_id: childDog?.owner_id || userId,
      is_public: false,
    }).select('id').single()

    if (created) {
      const field = ancestorPanel.role === 'father' ? 'father_id' : 'mother_id'
      await supabase.from('dogs').update({ [field]: created.id }).eq('id', ancestorPanel.dogId)
    }

    setSaving(false)
    setAncestorPanel(null)
    reloadPedigree()
  }

  // Disconnect dog from parent slot
  const disconnectDog = async () => {
    if (!editPanel?.parentDogId || !editPanel.role) return
    setSaving(true)
    const supabase = createClient()
    const field = editPanel.role === 'father' ? 'father_id' : 'mother_id'
    await supabase.from('dogs').update({ [field]: null }).eq('id', editPanel.parentDogId)
    setSaving(false)
    setEditPanel(null)
    reloadPedigree()
  }

  const expectedSex = ancestorPanel?.role === 'father' ? 'male' : 'female'
  const ancestorCandidates = allDogs.filter(d => {
    if (!ancestorPanel) return false
    if (d.sex !== expectedSex) return false
    if (d.id === ancestorPanel.dogId) return false
    if (!ancestorSearch) return true
    return d.name.toLowerCase().includes(ancestorSearch.toLowerCase())
  }).slice(0, 30)

  const editDogData = editPanel ? pedigreeData.find(n => n.id === editPanel.dogId) : null
  const anyPanelOpen = !!ancestorPanel || !!editPanel

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Left: Collapsible dog list — same style as sidebar */}
      <div className={`flex-shrink-0 border-r border-white/10 flex flex-col transition-all duration-300 ${listCollapsed ? 'w-[44px]' : 'w-[340px]'} h-full`}>
        {/* Collapse toggle header */}
        <div className="h-10 border-b border-white/10 flex items-center px-2 flex-shrink-0">
          <button onClick={() => setListCollapsed(!listCollapsed)}
            className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition flex-shrink-0">
            {listCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          {!listCollapsed && <span className="text-xs font-semibold text-white/50 ml-1">Perros</span>}
        </div>

        {!listCollapsed && (
          <>
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
              <div className="flex gap-1 mb-2">
                <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden flex-1">
                  {[
                    { key: 'incomplete', label: 'Incompletos' },
                    { key: 'no-parents', label: 'Sin padres' },
                    { key: 'all', label: 'Todos' },
                  ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key as any)}
                      className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition ${filter === f.key ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/40 hover:text-white/60'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-white/30 self-center ml-1">{filtered.length}</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar perro..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              {filtered.map(d => {
                const sexColor = d.sex === 'male' ? BRAND.male : BRAND.female
                const isSelected = selectedDog?.id === d.id
                return (
                  <button key={d.id} onClick={() => loadPedigree(d)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition ${
                      isSelected ? 'bg-[#D74709]/10 border border-[#D74709]/30' : 'border border-transparent hover:bg-white/5'
                    }`}>
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-white/5 border flex-shrink-0" style={{ borderColor: sexColor }}>
                      {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-white/15 text-[9px]">{d.sex === 'male' ? '♂' : '♀'}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{d.name}</p>
                      <p className="text-[10px] text-white/30 truncate">{(d.breed as any)?.name || '—'}</p>
                    </div>
                    <div className="w-10 flex-shrink-0">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${d.completeness}%`,
                          background: d.completeness === 100 ? '#10B981' : d.completeness > 50 ? '#F59E0B' : '#EF4444'
                        }} />
                      </div>
                      <p className="text-[8px] text-white/25 text-center mt-0.5">{d.completeness}%</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Center: Pedigree tree */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {!selectedDog ? (
          <div className="flex items-center justify-center h-full text-white/20">
            <div className="text-center">
              <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecciona un perro</p>
            </div>
          </div>
        ) : loadingPedigree ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : pedigreeData.length > 0 ? (
          <AdminPedigreeTree
            data={pedigreeData}
            rootId={selectedDog.id}
            onClickDog={handleClickDog}
            onClickEmpty={handleClickEmpty}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/20">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin datos de pedigrí</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Ancestor panel (add) */}
      {ancestorPanel && (
        <div className="w-[340px] flex-shrink-0 border-l border-white/10 flex flex-col h-full bg-gray-950">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div>
              <p className="text-sm font-semibold">Añadir {ancestorPanel.role === 'father' ? 'padre' : 'madre'}</p>
              <p className="text-[10px] text-white/30">a {ancestorPanel.dogName}</p>
            </div>
            <button onClick={() => setAncestorPanel(null)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          {/* Sex indicator */}
          <div className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 ${ancestorPanel.role === 'father' ? 'bg-blue-500/5 text-blue-400' : 'bg-pink-500/5 text-pink-400'}`}>
            {ancestorPanel.role === 'father' ? '♂ Se creará como macho' : '♀ Se creará como hembra'}
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            <button onClick={() => setAncestorMode('existing')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition border-b-2 -mb-px ${ancestorMode === 'existing' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40'}`}>
              <Link2 className="w-3.5 h-3.5" /> Existente
            </button>
            <button onClick={() => setAncestorMode('new')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition border-b-2 -mb-px ${ancestorMode === 'new' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40'}`}>
              <Plus className="w-3.5 h-3.5" /> Nuevo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {ancestorMode === 'existing' ? (
              <div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input type="text" value={ancestorSearch} onChange={e => setAncestorSearch(e.target.value)}
                    placeholder={`Buscar ${ancestorPanel.role === 'father' ? 'macho' : 'hembra'}...`} autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  {ancestorCandidates.map(d => (
                    <button key={d.id} onClick={() => linkExisting(d.id)} disabled={saving}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:bg-white/5 transition text-left disabled:opacity-50">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white/5 border flex-shrink-0" style={{ borderColor: d.sex === 'male' ? BRAND.male : BRAND.female }}>
                        {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      <span className="truncate flex-1">{d.name}</span>
                      {(d.breed as any)?.name && <span className="text-[10px] text-white/20">{(d.breed as any).name}</span>}
                    </button>
                  ))}
                  {ancestorCandidates.length === 0 && <p className="text-[10px] text-white/20 text-center py-4">Sin resultados</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">Nombre *</label>
                  <input type="text" value={newAncestor.name} onChange={e => setNewAncestor(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre del ancestro" autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">Raza</label>
                  <select value={newAncestor.breed_id} onChange={e => setNewAncestor(p => ({ ...p, breed_id: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/60 focus:border-[#D74709] focus:outline-none appearance-none">
                    <option value="">Sin raza</option>
                    {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">Color</label>
                  <select value={newAncestor.color_id} onChange={e => setNewAncestor(p => ({ ...p, color_id: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/60 focus:border-[#D74709] focus:outline-none appearance-none">
                    <option value="">Sin color</option>
                    {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={createAndLink} disabled={saving || !newAncestor.name.trim()}
                  className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Creando...' : 'Crear y vincular'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right: Edit panel (click on existing node) */}
      {editPanel && editDogData && (
        <div className="w-[340px] flex-shrink-0 border-l border-white/10 flex flex-col h-full bg-gray-950">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <p className="text-sm font-semibold">{editDogData.name}</p>
            <button onClick={() => setEditPanel(null)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-4 space-y-4">
            {/* Dog info */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border-2 flex-shrink-0" style={{ borderColor: editDogData.sex === 'male' ? BRAND.male : BRAND.female }}>
                {editDogData.photo_url ? <img src={editDogData.photo_url} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-white/15 text-lg">{editDogData.sex === 'male' ? '♂' : '♀'}</div>}
              </div>
              <div>
                <p className="text-sm font-bold">{editDogData.name}</p>
                <p className="text-[10px] text-white/30">
                  {editDogData.sex === 'male' ? '♂ Macho' : '♀ Hembra'}
                  {editDogData.breed_name && ` · ${editDogData.breed_name}`}
                </p>
                {editDogData.registration && <p className="text-[10px] text-white/20 font-mono">{editDogData.registration}</p>}
              </div>
            </div>

            {/* Role info */}
            {editPanel.role && (
              <p className="text-xs text-white/40">
                Vinculado como <strong className="text-white/60">{editPanel.role === 'father' ? 'padre' : 'madre'}</strong> de {pedigreeData.find(n => n.id === editPanel.parentDogId)?.name || '?'}
              </p>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <a href={`/dogs/${editPanel.dogId}`} target="_blank"
                className="w-full flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 text-white/60 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition">
                Ver perfil completo ↗
              </a>

              {editPanel.role && editPanel.parentDogId && (
                <button onClick={disconnectDog} disabled={saving}
                  className="w-full flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-500/20 transition disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                  {saving ? 'Desconectando...' : 'Desconectar de este nodo'}
                </button>
              )}
            </div>

            {/* Missing parents of this node */}
            {(!editDogData.father_id || !editDogData.mother_id) && (
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-white/40 mb-2">Ancestros faltantes:</p>
                <div className="space-y-2">
                  {!editDogData.father_id && (
                    <button onClick={() => { setEditPanel(null); handleClickEmpty(editDogData.id, 'father') }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-blue-400/30 text-blue-400 text-xs font-medium hover:bg-blue-500/5 transition">
                      <Plus className="w-3.5 h-3.5" /> Añadir padre
                    </button>
                  )}
                  {!editDogData.mother_id && (
                    <button onClick={() => { setEditPanel(null); handleClickEmpty(editDogData.id, 'mother') }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-pink-400/30 text-pink-400 text-xs font-medium hover:bg-pink-500/5 transition">
                      <Plus className="w-3.5 h-3.5" /> Añadir madre
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
