'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Link2, Unlink, Search, Loader2, GitBranch } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import AdminPedigreeTree from '../admin/admin-pedigree-tree'

interface Props {
  open: boolean
  onClose: () => void
  dogId: string
  userId: string
}

export default function PedigreeEditor({ open, onClose, dogId, userId }: Props) {
  const [pedigreeData, setPedigreeData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dogName, setDogName] = useState('')
  const [breeds, setBreeds] = useState<any[]>([])
  const [colors, setColors] = useState<any[]>([])
  const [allDogs, setAllDogs] = useState<any[]>([])

  // Side panel for add/edit ancestor
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'add' | 'edit'>('add')
  const [panelTarget, setPanelTarget] = useState<{ dogId: string; role: 'father' | 'mother'; dogName: string } | null>(null)
  const [editNodeData, setEditNodeData] = useState<any>(null)
  const [editNodeParent, setEditNodeParent] = useState<{ parentId: string; role: 'father' | 'mother' } | null>(null)

  const [ancestorMode, setAncestorMode] = useState<'existing' | 'new'>('existing')
  const [ancestorSearch, setAncestorSearch] = useState('')
  const [newAncestor, setNewAncestor] = useState({ name: '', breed_id: '', color_id: '' })
  const [saving, setSaving] = useState(false)

  // Load data when opened
  useEffect(() => {
    if (!open || !dogId) return
    setLoading(true)
    setPanelOpen(false)
    const supabase = createClient()

    async function load() {
      const [pedigreeRes, breedsRes, colorsRes, dogsRes, dogRes] = await Promise.all([
        supabase.rpc('get_pedigree', { dog_uuid: dogId, max_gen: 10 }),
        supabase.from('breeds').select('id, name').order('name'),
        supabase.from('colors').select('id, name').order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed:breeds(name)').order('name').limit(1000),
        supabase.from('dogs').select('name').eq('id', dogId).single(),
      ])
      setPedigreeData(pedigreeRes.data || [])
      setBreeds(breedsRes.data || [])
      setColors(colorsRes.data || [])
      setAllDogs(dogsRes.data || [])
      setDogName(dogRes.data?.name || '')
      setLoading(false)
    }
    load()
  }, [open, dogId])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (panelOpen) setPanelOpen(false); else onClose() } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, panelOpen, onClose])

  const reloadPedigree = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.rpc('get_pedigree', { dog_uuid: dogId, max_gen: 10 })
    setPedigreeData(data || [])
  }, [dogId])

  // Click on empty parent slot in tree
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

  // Click on existing dog in tree
  const handleClickDog = (clickedDogId: string) => {
    const node = pedigreeData.find(n => n.id === clickedDogId)
    if (!node) return
    const parentNode = pedigreeData.find(n => n.father_id === clickedDogId || n.mother_id === clickedDogId)
    const role = parentNode?.father_id === clickedDogId ? 'father' as const : parentNode?.mother_id === clickedDogId ? 'mother' as const : null
    setEditNodeData(node)
    setEditNodeParent(parentNode && role ? { parentId: parentNode.id, role } : null)
    setPanelMode('edit')
    setPanelTarget(null)
    setPanelOpen(true)
  }

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

  const createAndLink = async () => {
    if (!panelTarget || !newAncestor.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const sex = panelTarget.role === 'father' ? 'male' : 'female'
    const { data: created } = await supabase.from('dogs').insert({
      name: newAncestor.name.trim(), sex,
      breed_id: newAncestor.breed_id || null, color_id: newAncestor.color_id || null,
      contributor_id: userId, owner_id: null, is_public: true,
    }).select('id').single()
    if (created) {
      const field = panelTarget.role === 'father' ? 'father_id' : 'mother_id'
      await supabase.from('dogs').update({ [field]: created.id }).eq('id', panelTarget.dogId)
    }
    setSaving(false)
    setPanelOpen(false)
    reloadPedigree()
  }

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

  if (!open) return null

  return (
    <>
      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-[80] bg-gray-950 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 flex-shrink-0 bg-gray-900">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#D74709]" />
            <h2 className="text-sm sm:text-base font-semibold">Genealogía de {dogName}</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tree area — fills remaining space, AdminPedigreeTree handles scroll + controls */}
        <div className="flex-1 relative min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
          ) : pedigreeData.length > 0 ? (
            <AdminPedigreeTree data={pedigreeData} rootId={dogId} onClickDog={handleClickDog} onClickEmpty={handleClickEmpty} />
          ) : (
            <div className="flex items-center justify-center h-full text-white/20">
              <div className="text-center">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin datos de genealogía</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ancestor panel (add / edit) */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-[2px]" onClick={() => setPanelOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full sm:max-w-md z-[100] bg-gray-900 border-l border-white/10 shadow-2xl flex flex-col">

            {panelMode === 'add' && panelTarget && (
              <>
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
                  <div>
                    <p className="text-sm font-semibold">Añadir {panelTarget.role === 'father' ? 'padre' : 'madre'}</p>
                    <p className="text-[10px] text-white/30">a {panelTarget.dogName}</p>
                  </div>
                  <button onClick={() => setPanelOpen(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className={`px-4 sm:px-5 py-2 text-xs font-medium flex items-center gap-1.5 flex-shrink-0 ${panelTarget.role === 'father' ? 'bg-blue-500/5 text-blue-400' : 'bg-pink-500/5 text-pink-400'}`}>
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

                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
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
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/5 transition text-left disabled:opacity-50">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 border-2 flex-shrink-0" style={{ borderColor: d.sex === 'male' ? BRAND.male : BRAND.female }}>
                              {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                            </div>
                            <span className="truncate flex-1 font-medium">{d.name}</span>
                            {d.breed?.name && <span className="text-[10px] text-white/20">{d.breed.name}</span>}
                          </button>
                        ))}
                        {ancestorCandidates.length === 0 && <p className="text-xs text-white/20 text-center py-6">Sin resultados</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Nombre *</label>
                        <input type="text" value={newAncestor.name} onChange={e => setNewAncestor(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del ancestro" autoFocus
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Raza</label>
                        <select value={newAncestor.breed_id} onChange={e => setNewAncestor(p => ({ ...p, breed_id: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/60 focus:border-[#D74709] focus:outline-none appearance-none">
                          <option value="">Sin raza</option>
                          {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Color</label>
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

            {panelMode === 'edit' && editNodeData && (
              <>
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
                  <p className="text-sm font-semibold">{editNodeData.name}</p>
                  <button onClick={() => setPanelOpen(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 border-2 flex-shrink-0" style={{ borderColor: editNodeData.sex === 'male' ? BRAND.male : BRAND.female }}>
                      {editNodeData.photo_url ? <img src={editNodeData.photo_url} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-white/15 text-2xl">{editNodeData.sex === 'male' ? '♂' : '♀'}</div>}
                    </div>
                    <div>
                      <p className="font-bold">{editNodeData.name}</p>
                      <p className="text-xs text-white/40">{editNodeData.sex === 'male' ? '♂ Macho' : '♀ Hembra'}{editNodeData.breed_name && ` · ${editNodeData.breed_name}`}</p>
                      {editNodeData.registration && <p className="text-[10px] text-white/20 font-mono mt-0.5">{editNodeData.registration}</p>}
                    </div>
                  </div>

                  {editNodeParent && (
                    <p className="text-xs text-white/40">
                      Vinculado como <strong className={editNodeParent.role === 'father' ? 'text-blue-400' : 'text-pink-400'}>{editNodeParent.role === 'father' ? 'padre' : 'madre'}</strong> de {pedigreeData.find(n => n.id === editNodeParent.parentId)?.name || '?'}
                    </p>
                  )}

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

                  {(!editNodeData.father_id || !editNodeData.mother_id) && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-xs text-white/40 mb-2">Ancestros faltantes:</p>
                      <div className="space-y-2">
                        {!editNodeData.father_id && (
                          <button onClick={() => { setPanelOpen(false); setTimeout(() => handleClickEmpty(editNodeData.id, 'father'), 150) }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-blue-400/30 text-blue-400 text-xs font-medium hover:bg-blue-500/5 transition">
                            <Plus className="w-3.5 h-3.5" /> Añadir padre
                          </button>
                        )}
                        {!editNodeData.mother_id && (
                          <button onClick={() => { setPanelOpen(false); setTimeout(() => handleClickEmpty(editNodeData.id, 'mother'), 150) }}
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
      )}
    </>
  )
}
