'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, GitBranch, AlertTriangle, Loader2, PanelLeftClose, PanelLeftOpen, X, Plus, Link2, Unlink } from 'lucide-react'
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

  // Slide panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'add' | 'edit'>('add')
  const [panelTarget, setPanelTarget] = useState<{ dogId: string; role: 'father' | 'mother'; dogName: string } | null>(null)
  const [editNodeData, setEditNodeData] = useState<any>(null)
  const [editNodeParent, setEditNodeParent] = useState<{ parentId: string; role: 'father' | 'mother' } | null>(null)

  // Add form state
  const [ancestorMode, setAncestorMode] = useState<'existing' | 'new'>('existing')
  const [ancestorSearch, setAncestorSearch] = useState('')
  const [newAncestor, setNewAncestor] = useState({ name: '', breed_id: '', color_id: '' })
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

  const loadPedigree = useCallback(async (dog: any) => {
    setSelectedDog(dog)
    setLoadingPedigree(true)
    setPanelOpen(false)
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

  // Click empty slot → open slide panel in add mode
  const handleClickEmpty = (parentDogId: string, role: 'father' | 'mother') => {
    const parentNode = pedigreeData.find(n => n.id === parentDogId)
    setPanelTarget({ dogId: parentDogId, role, dogName: parentNode?.name || '?' })
    setPanelMode('add')
    setAncestorMode('existing')
    setAncestorSearch('')
    setNewAncestor({ name: '', breed_id: '', color_id: '' })
    setEditNodeData(null)
    setPanelOpen(true)
  }

  // Click filled node → open slide panel in edit mode
  const handleClickDog = (dogId: string) => {
    const node = pedigreeData.find(n => n.id === dogId)
    if (!node) return
    const parentNode = pedigreeData.find(n => n.father_id === dogId || n.mother_id === dogId)
    const role = parentNode?.father_id === dogId ? 'father' as const : parentNode?.mother_id === dogId ? 'mother' as const : null
    setEditNodeData(node)
    setEditNodeParent(parentNode && role ? { parentId: parentNode.id, role } : null)
    setPanelMode('edit')
    setPanelTarget(null)
    setPanelOpen(true)
  }

  // Link existing dog
  const linkExisting = async (ancestorId: string) => {
    if (!panelTarget) return
    setSaving(true)
    const supabase = createClient()
    const field = panelTarget.role === 'father' ? 'father_id' : 'mother_id'
    await supabase.from('dogs').update({ [field]: ancestorId }).eq('id', panelTarget.dogId)
    setSaving(false)
    setPanelOpen(false)
    reloadPedigree()
  }

  // Create and link
  const createAndLink = async () => {
    if (!panelTarget || !newAncestor.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const childDog = allDogs.find(d => d.id === panelTarget.dogId)
    const sex = panelTarget.role === 'father' ? 'male' : 'female'
    const { data: created } = await supabase.from('dogs').insert({
      name: newAncestor.name.trim(), sex,
      breed_id: newAncestor.breed_id || null, color_id: newAncestor.color_id || null,
      owner_id: childDog?.owner_id || userId, is_public: false,
    }).select('id').single()
    if (created) {
      const field = panelTarget.role === 'father' ? 'father_id' : 'mother_id'
      await supabase.from('dogs').update({ [field]: created.id }).eq('id', panelTarget.dogId)
    }
    setSaving(false)
    setPanelOpen(false)
    reloadPedigree()
  }

  // Disconnect
  const disconnectDog = async () => {
    if (!editNodeParent) return
    setSaving(true)
    const supabase = createClient()
    const field = editNodeParent.role === 'father' ? 'father_id' : 'mother_id'
    await supabase.from('dogs').update({ [field]: null }).eq('id', editNodeParent.parentId)
    setSaving(false)
    setPanelOpen(false)
    reloadPedigree()
  }

  const expectedSex = panelTarget?.role === 'father' ? 'male' : 'female'
  const ancestorCandidates = allDogs.filter(d => {
    if (!panelTarget) return false
    if (d.sex !== expectedSex) return false
    if (d.id === panelTarget.dogId) return false
    if (!ancestorSearch) return true
    return d.name.toLowerCase().includes(ancestorSearch.toLowerCase())
  }).slice(0, 30)

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* LEFT: Fixed dog list panel — extension of admin sidebar */}
      <div className={`flex-shrink-0 bg-gray-950 border-r border-white/10 flex flex-col transition-all duration-300 h-full ${listCollapsed ? 'w-[44px]' : 'w-[300px]'}`}>
        <div className="h-10 border-b border-white/10 flex items-center px-2 flex-shrink-0">
          <button onClick={() => setListCollapsed(!listCollapsed)}
            className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition flex-shrink-0">
            {listCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          {!listCollapsed && <span className="text-xs font-semibold text-white/40 ml-1">Perros</span>}
        </div>

        {!listCollapsed && (
          <>
            <div className="px-2 pt-2 pb-1 flex-shrink-0">
              <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden mb-2">
                {[
                  { key: 'incomplete', label: 'Incompletos' },
                  { key: 'no-parents', label: 'Sin padres' },
                  { key: 'all', label: 'Todos' },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key as any)}
                    className={`flex-1 px-1 py-1.5 text-[9px] font-medium transition ${filter === f.key ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/40 hover:text-white/60'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-1 pb-1">
              {filtered.map(d => {
                const sexColor = d.sex === 'male' ? BRAND.male : BRAND.female
                const isSelected = selectedDog?.id === d.id
                return (
                  <button key={d.id} onClick={() => loadPedigree(d)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition mb-px ${
                      isSelected ? 'bg-[#D74709]/10' : 'hover:bg-white/5'
                    }`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/5 border flex-shrink-0" style={{ borderColor: sexColor }}>
                      {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-white/15 text-[8px]">{d.sex === 'male' ? '♂' : '♀'}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">{d.name}</p>
                    </div>
                    <div className="w-8 flex-shrink-0">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${d.completeness}%`,
                          background: d.completeness === 100 ? '#10B981' : d.completeness > 50 ? '#F59E0B' : '#EF4444'
                        }} />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* CENTER: Pedigree tree */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {!selectedDog ? (
          <div className="flex items-center justify-center h-full text-white/20">
            <div className="text-center">
              <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecciona un perro</p>
            </div>
          </div>
        ) : loadingPedigree ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : pedigreeData.length > 0 ? (
          <AdminPedigreeTree data={pedigreeData} rootId={selectedDog.id} onClickDog={handleClickDog} onClickEmpty={handleClickEmpty} />
        ) : (
          <div className="flex items-center justify-center h-full text-white/20">
            <AlertTriangle className="w-8 h-8 opacity-30" />
          </div>
        )}
      </div>

      {/* RIGHT: Slide panel (add ancestor or edit node) */}
      <>
        <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${panelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setPanelOpen(false)} />

        <div className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>

          {/* ADD MODE */}
          {panelMode === 'add' && panelTarget && (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
                <div>
                  <p className="text-sm font-semibold">Añadir {panelTarget.role === 'father' ? 'padre' : 'madre'}</p>
                  <p className="text-[10px] text-white/30">a {panelTarget.dogName}</p>
                </div>
                <button onClick={() => setPanelOpen(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className={`px-5 py-2 text-xs font-medium flex items-center gap-1.5 flex-shrink-0 ${panelTarget.role === 'father' ? 'bg-blue-500/5 text-blue-400' : 'bg-pink-500/5 text-pink-400'}`}>
                {panelTarget.role === 'father' ? '♂ Se creará como macho' : '♀ Se creará como hembra'}
              </div>

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

              <div className="flex-1 overflow-y-auto p-5">
                {ancestorMode === 'existing' ? (
                  <div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input type="text" value={ancestorSearch} onChange={e => setAncestorSearch(e.target.value)}
                        placeholder={`Buscar ${panelTarget.role === 'father' ? 'macho' : 'hembra'}...`} autoFocus
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      {ancestorCandidates.map(d => (
                        <button key={d.id} onClick={() => linkExisting(d.id)} disabled={saving}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-white/60 hover:bg-white/5 transition text-left disabled:opacity-50">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-white/5 border flex-shrink-0" style={{ borderColor: d.sex === 'male' ? BRAND.male : BRAND.female }}>
                            {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                          </div>
                          <span className="truncate flex-1 font-medium">{d.name}</span>
                          {(d.breed as any)?.name && <span className="text-[10px] text-white/20">{(d.breed as any).name}</span>}
                        </button>
                      ))}
                      {ancestorCandidates.length === 0 && <p className="text-xs text-white/20 text-center py-6">Sin resultados</p>}
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
            </>
          )}

          {/* EDIT MODE */}
          {panelMode === 'edit' && editNodeData && (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
                <p className="text-sm font-semibold">{editNodeData.name}</p>
                <button onClick={() => setPanelOpen(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Dog info card */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 border-2 flex-shrink-0" style={{ borderColor: editNodeData.sex === 'male' ? BRAND.male : BRAND.female }}>
                    {editNodeData.photo_url ? <img src={editNodeData.photo_url} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-white/15 text-2xl">{editNodeData.sex === 'male' ? '♂' : '♀'}</div>}
                  </div>
                  <div>
                    <p className="font-bold">{editNodeData.name}</p>
                    <p className="text-xs text-white/40">
                      {editNodeData.sex === 'male' ? '♂ Macho' : '♀ Hembra'}
                      {editNodeData.breed_name && ` · ${editNodeData.breed_name}`}
                    </p>
                    {editNodeData.color_name && <p className="text-[10px] text-white/25">{editNodeData.color_name}</p>}
                    {editNodeData.registration && <p className="text-[10px] text-white/20 font-mono mt-0.5">{editNodeData.registration}</p>}
                  </div>
                </div>

                {/* Role info */}
                {editNodeParent && (
                  <p className="text-xs text-white/40">
                    Vinculado como <strong className={editNodeParent.role === 'father' ? 'text-blue-400' : 'text-pink-400'}>{editNodeParent.role === 'father' ? 'padre' : 'madre'}</strong> de {pedigreeData.find(n => n.id === editNodeParent.parentId)?.name || '?'}
                  </p>
                )}

                {/* Actions */}
                <a href={`/dogs/${editNodeData.id}`} target="_blank"
                  className="w-full flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 text-white/60 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition">
                  Ver perfil completo ↗
                </a>

                {editNodeParent && (
                  <button onClick={disconnectDog} disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-500/20 transition disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                    {saving ? 'Desconectando...' : 'Desconectar de este nodo'}
                  </button>
                )}

                {/* Missing parents */}
                {(!editNodeData.father_id || !editNodeData.mother_id) && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-white/40 mb-2">Ancestros faltantes:</p>
                    <div className="space-y-2">
                      {!editNodeData.father_id && (
                        <button onClick={() => { setPanelOpen(false); setTimeout(() => handleClickEmpty(editNodeData.id, 'father'), 100) }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-blue-400/30 text-blue-400 text-xs font-medium hover:bg-blue-500/5 transition">
                          <Plus className="w-3.5 h-3.5" /> Añadir padre
                        </button>
                      )}
                      {!editNodeData.mother_id && (
                        <button onClick={() => { setPanelOpen(false); setTimeout(() => handleClickEmpty(editNodeData.id, 'mother'), 100) }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-pink-400/30 text-pink-400 text-xs font-medium hover:bg-pink-500/5 transition">
                          <Plus className="w-3.5 h-3.5" /> Añadir madre
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </>
    </div>
  )
}
