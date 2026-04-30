'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Link2, Unlink, Search, Loader2, GitBranch, Check } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import AdminPedigreeTree from '../admin/admin-pedigree-tree'
import DogFormPanel from '../dogs/dog-form-panel'

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
  const [allDogs, setAllDogs] = useState<any[]>([])

  // Side panel for linking existing ancestor
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'add' | 'edit'>('add')
  const [panelTarget, setPanelTarget] = useState<{ dogId: string; role: 'father' | 'mother'; dogName: string } | null>(null)
  const [editNodeData, setEditNodeData] = useState<any>(null)
  const [editNodeParent, setEditNodeParent] = useState<{ parentId: string; role: 'father' | 'mother' } | null>(null)

  const [ancestorSearch, setAncestorSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // DogFormPanel for creating new ancestor
  const [dogFormOpen, setDogFormOpen] = useState(false)
  const [dogFormSex, setDogFormSex] = useState<string>('male')

  // Saved indicator
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (!open || !dogId) return
    setLoading(true)
    setPanelOpen(false)
    setDogFormOpen(false)
    const supabase = createClient()

    async function load() {
      const [pedigreeRes, dogsRes, dogRes] = await Promise.all([
        supabase.rpc('get_pedigree', { dog_uuid: dogId, max_gen: 10 }),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed:breeds(name)').order('name').limit(1000),
        supabase.from('dogs').select('name').eq('id', dogId).single(),
      ])
      setPedigreeData(pedigreeRes.data || [])
      setAllDogs(dogsRes.data || [])
      setDogName(dogRes.data?.name || '')
      setLoading(false)
    }
    load()
  }, [open, dogId])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (panelOpen) setPanelOpen(false); else if (!dogFormOpen) onClose() } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, panelOpen, dogFormOpen, onClose])

  const reloadPedigree = useCallback(async () => {
    const supabase = createClient()
    const [pedigreeRes, dogsRes] = await Promise.all([
      supabase.rpc('get_pedigree', { dog_uuid: dogId, max_gen: 10 }),
      supabase.from('dogs').select('id, name, sex, thumbnail_url, breed:breeds(name)').order('name').limit(1000),
    ])
    setPedigreeData(pedigreeRes.data || [])
    setAllDogs(dogsRes.data || [])
  }, [dogId])

  const handleClickEmpty = (parentDogId: string, role: 'father' | 'mother') => {
    const parentNode = pedigreeData.find(n => n.id === parentDogId)
    setPanelTarget({ dogId: parentDogId, role, dogName: parentNode?.name || '?' })
    setPanelMode('add')
    setAncestorSearch('')
    setEditNodeData(null)
    setPanelOpen(true)
  }

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
    flashSaved()
    reloadPedigree()
  }

  const openNewAncestorForm = () => {
    if (!panelTarget) return
    setDogFormSex(panelTarget.role === 'father' ? 'male' : 'female')
    setPanelOpen(false)
    setDogFormOpen(true)
  }

  const handleNewAncestorSaved = async (newDogId?: string) => {
    if (newDogId && panelTarget) {
      const supabase = createClient()
      const field = panelTarget.role === 'father' ? 'father_id' : 'mother_id'
      await supabase.from('dogs').update({ [field]: newDogId }).eq('id', panelTarget.dogId)
    }
    setDogFormOpen(false)
    flashSaved()
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
    flashSaved()
    reloadPedigree()
  }

  const flashSaved = () => {
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
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
      <div className="fixed inset-0 z-[80] bg-ink-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-hair flex-shrink-0 bg-ink-800">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#D74709]" />
            <h2 className="text-sm sm:text-base font-semibold">Genealogía de {dogName}</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Saved indicator */}
            {showSaved && (
              <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-lg">
                <Check className="w-3.5 h-3.5" /> Guardado
              </span>
            )}
            <button onClick={onClose} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Listo
            </button>
          </div>
        </div>

        {/* Tree area */}
        <div className="flex-1 relative min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-fg-mute" /></div>
          ) : pedigreeData.length > 0 ? (
            <AdminPedigreeTree data={pedigreeData} rootId={dogId} onClickDog={handleClickDog} onClickEmpty={handleClickEmpty} />
          ) : (
            <div className="flex items-center justify-center h-full text-fg-mute">
              <div className="text-center">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin datos de genealogía</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ancestor panel (link existing / edit node) */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-[2px]" onClick={() => setPanelOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full sm:max-w-md z-[100] bg-ink-800 border-l border-hair shadow-2xl flex flex-col">

            {panelMode === 'add' && panelTarget && (
              <>
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-hair flex-shrink-0">
                  <div>
                    <p className="text-sm font-semibold">Añadir {panelTarget.role === 'father' ? 'padre' : 'madre'}</p>
                    <p className="text-[10px] text-fg-mute">a {panelTarget.dogName}</p>
                  </div>
                  <button onClick={() => setPanelOpen(false)} className="text-fg-mute hover:text-fg"><X className="w-5 h-5" /></button>
                </div>

                <div className={`px-4 sm:px-5 py-2 text-xs font-medium flex items-center gap-1.5 flex-shrink-0 ${panelTarget.role === 'father' ? 'bg-blue-500/5 text-blue-400' : 'bg-pink-500/5 text-pink-400'}`}>
                  {panelTarget.role === 'father' ? '♂ Se buscará/creará como macho' : '♀ Se buscará/creará como hembra'}
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  {/* Search existing */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-mute" />
                    <input type="text" value={ancestorSearch} onChange={e => setAncestorSearch(e.target.value)}
                      placeholder={`Buscar ${panelTarget.role === 'father' ? 'macho' : 'hembra'} existente...`} autoFocus
                      className="w-full bg-chip border border-hair rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    {ancestorCandidates.map(d => (
                      <button key={d.id} onClick={() => linkExisting(d.id)} disabled={saving}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-fg-dim hover:bg-chip transition text-left disabled:opacity-50">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-chip border-2 flex-shrink-0" style={{ borderColor: d.sex === 'male' ? BRAND.male : BRAND.female }}>
                          {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                        </div>
                        <span className="truncate flex-1 font-medium">{d.name}</span>
                        {d.breed?.name && <span className="text-[10px] text-fg-mute">{d.breed.name}</span>}
                      </button>
                    ))}
                    {ancestorCandidates.length === 0 && ancestorSearch && <p className="text-xs text-fg-mute text-center py-4">Sin resultados</p>}
                  </div>
                </div>

                {/* Create new — fixed at bottom */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-hair flex-shrink-0">
                  <button onClick={openNewAncestorForm}
                    className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4" /> Crear nuevo {panelTarget.role === 'father' ? 'perro' : 'perra'}
                  </button>
                </div>
              </>
            )}

            {panelMode === 'edit' && editNodeData && (
              <>
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-hair flex-shrink-0">
                  <p className="text-sm font-semibold">{editNodeData.name}</p>
                  <button onClick={() => setPanelOpen(false)} className="text-fg-mute hover:text-fg"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-3 bg-chip border border-hair rounded-xl p-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-chip border-2 flex-shrink-0" style={{ borderColor: editNodeData.sex === 'male' ? BRAND.male : BRAND.female }}>
                      {editNodeData.photo_url ? <img src={editNodeData.photo_url} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-fg-mute text-2xl">{editNodeData.sex === 'male' ? '♂' : '♀'}</div>}
                    </div>
                    <div>
                      <p className="font-bold">{editNodeData.name}</p>
                      <p className="text-xs text-fg-mute">{editNodeData.sex === 'male' ? '♂ Macho' : '♀ Hembra'}{editNodeData.breed_name && ` · ${editNodeData.breed_name}`}</p>
                      {editNodeData.registration && <p className="text-[10px] text-fg-mute font-mono mt-0.5">{editNodeData.registration}</p>}
                    </div>
                  </div>

                  {editNodeParent && (
                    <p className="text-xs text-fg-mute">
                      Vinculado como <strong className={editNodeParent.role === 'father' ? 'text-blue-400' : 'text-pink-400'}>{editNodeParent.role === 'father' ? 'padre' : 'madre'}</strong> de {pedigreeData.find(n => n.id === editNodeParent.parentId)?.name || '?'}
                    </p>
                  )}

                  <a href={`/dogs/${(editNodeData as any).slug || editNodeData.id}`} target="_blank"
                    className="w-full flex items-center justify-center gap-1.5 bg-chip border border-hair text-fg-dim px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-chip transition">
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
                    <div className="border-t border-hair pt-4">
                      <p className="text-xs text-fg-mute mb-2">Ancestros faltantes:</p>
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

      {/* Full DogFormPanel for creating new ancestor — z-index above everything */}
      {dogFormOpen && (
        <div className="fixed inset-0 z-[110]">
          <DogFormPanel
            open={dogFormOpen}
            onClose={() => setDogFormOpen(false)}
            onSaved={handleNewAncestorSaved}
            userId={userId}
          />
        </div>
      )}
    </>
  )
}
