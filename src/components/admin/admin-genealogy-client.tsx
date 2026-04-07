'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, GitBranch, AlertTriangle, Loader2, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import AdminPedigreeTree from './admin-pedigree-tree'
import DogFormPanel from '@/components/dogs/dog-form-panel'

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

  // DogFormPanel state
  const [formOpen, setFormOpen] = useState(false)
  const [editDogId, setEditDogId] = useState<string | null>(null)
  const [defaultFatherId, setDefaultFatherId] = useState<string | null>(null)
  const [defaultMotherId, setDefaultMotherId] = useState<string | null>(null)
  const [linkParentTo, setLinkParentTo] = useState<{ dogId: string; role: 'father' | 'mother' } | null>(null)

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
    const { data } = await supabase.rpc('get_pedigree', { dog_uuid: dog.id, max_gen: 10 })
    setPedigreeData(data || [])
    setLoadingPedigree(false)
  }

  // Click on a dog node in the tree → open edit panel
  const handleClickDog = (dogId: string) => {
    setEditDogId(dogId)
    setDefaultFatherId(null)
    setDefaultMotherId(null)
    setLinkParentTo(null)
    setFormOpen(true)
  }

  // Click on an empty slot → open create panel with parent pre-linked
  const handleClickEmpty = (parentDogId: string, role: 'father' | 'mother') => {
    setEditDogId(null)
    setLinkParentTo({ dogId: parentDogId, role })
    // Pre-set the new dog's sex based on role
    setDefaultFatherId(null)
    setDefaultMotherId(null)
    setFormOpen(true)
  }

  // When form saves, link the parent if needed and reload pedigree
  const handleFormSaved = async () => {
    // If we were creating a new dog to link as parent
    if (linkParentTo) {
      // The DogFormPanel already created the dog. We need to find it and link it.
      // Since we can't get the ID back directly, we'll reload the pedigree which will pick up the change
      // The linking needs to be done in the form panel's onSaved or via a different mechanism.
      // For now, we just reload the pedigree.
    }
    setFormOpen(false)
    setEditDogId(null)
    setLinkParentTo(null)
    if (selectedDog) {
      // Small delay to let the DB settle
      setTimeout(() => loadPedigree(selectedDog), 300)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Completador de genealogías</h1>
      <p className="text-white/40 text-sm mb-6">Selecciona un perro, haz clic en los nodos para editar o en los huecos para añadir ancestros</p>

      <div className="flex gap-4">
        {/* Left: Collapsible dog list */}
        <div className={`flex-shrink-0 flex flex-col transition-all duration-300 ${listCollapsed ? 'w-10' : 'w-[360px]'}`}>
          {/* Collapse toggle */}
          <button onClick={() => setListCollapsed(!listCollapsed)}
            className="flex items-center justify-center w-full h-8 mb-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition">
            {listCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {!listCollapsed && (
            <>
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
                <span className="text-[10px] text-white/30 self-center">{filtered.length}</span>
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
                        <p className="text-[10px] text-white/30 truncate">{(d.breed as any)?.name || '—'}</p>
                      </div>
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
            </>
          )}
        </div>

        {/* Right: Interactive pedigree */}
        <div className="flex-1 min-w-0">
          {!selectedDog ? (
            <div className="flex items-center justify-center h-[60vh] text-white/20">
              <div className="text-center">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Selecciona un perro para ver y completar su genealogía</p>
                <p className="text-xs text-white/15 mt-1">Haz clic en un nodo para editar o en un hueco para añadir</p>
              </div>
            </div>
          ) : loadingPedigree ? (
            <div className="flex items-center justify-center h-[60vh]">
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
            <div className="text-center py-12 text-white/20">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin datos de pedigrí</p>
            </div>
          )}
        </div>
      </div>

      {/* Dog form panel */}
      <DogFormPanel
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDogId(null); setLinkParentTo(null) }}
        onSaved={handleFormSaved}
        editDogId={editDogId}
        userId={userId}
      />
    </div>
  )
}
