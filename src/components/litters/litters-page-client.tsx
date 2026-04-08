'use client'

import { useState } from 'react'
import { Search, Plus, Grid3X3, List, Trash2, Edit, Eye, Calendar, Baby, Lock, Globe } from 'lucide-react'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import LitterFormPanel from './litter-form-panel'
import DogFormPanel from '@/components/dogs/dog-form-panel'

interface Litter {
  id: string
  birth_date: string | null
  mating_date: string | null
  puppy_count: number | null
  is_public: boolean
  status: string
  breed: any
  father: any
  mother: any
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  planned: { label: 'Planificada', color: '#3498db', icon: '📅' },
  mated: { label: 'Cubricion', color: '#f39c12', icon: '💛' },
  born: { label: 'Parto', color: '#27ae60', icon: '🐾' },
  // Legacy support
  confirmed: { label: 'Parto', color: '#27ae60', icon: '🐾' },
  pending: { label: 'Cubricion', color: '#f39c12', icon: '💛' },
}

export default function LittersPageClient({ litters, userId, userKennelId, userKennelName, userAffixFormat }: { litters: Litter[]; userId: string; userKennelId?: string | null; userKennelName?: string | null; userAffixFormat?: string | null }) {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('litters-view') as 'grid' | 'list') || 'grid'
    return 'grid'
  })
  const changeView = (v: 'grid' | 'list') => { setViewMode(v); localStorage.setItem('litters-view', v) }
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editLitterId, setEditLitterId] = useState<string | null>(null)
  // Dog panel for adding puppy to specific litter
  const [dogPanelOpen, setDogPanelOpen] = useState(false)
  const [addPuppyLitterId, setAddPuppyLitterId] = useState<string | null>(null)
  const [addPuppyBreedId, setAddPuppyBreedId] = useState<string | null>(null)
  const [addPuppyFatherId, setAddPuppyFatherId] = useState<string | null>(null)
  const [addPuppyMotherId, setAddPuppyMotherId] = useState<string | null>(null)
  const [addPuppyKennelId, setAddPuppyKennelId] = useState<string | null>(null)
  const router = useRouter()

  const openAdd = () => { setEditLitterId(null); setPanelOpen(true) }
  const openEdit = (id: string) => { setEditLitterId(id); setPanelOpen(true) }
  const closePanel = () => { setPanelOpen(false); setEditLitterId(null) }

  const openAddPuppy = (litter: Litter) => {
    const breed = Array.isArray(litter.breed) ? litter.breed[0] : litter.breed
    const father = litter.father as any
    const mother = litter.mother as any
    setAddPuppyLitterId(litter.id)
    setAddPuppyBreedId(breed?.id || null)
    setAddPuppyFatherId(father?.id || null)
    setAddPuppyMotherId(mother?.id || null)
    setAddPuppyKennelId((litter as any).kennel_id || userKennelId || null)
    setDogPanelOpen(true)
  }

  const filtered = litters.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    const fName = (l.father as any)?.name?.toLowerCase() || ''
    const mName = (l.mother as any)?.name?.toLowerCase() || ''
    const breedName = (Array.isArray(l.breed) ? l.breed[0]?.name : l.breed?.name)?.toLowerCase() || ''
    return fName.includes(q) || mName.includes(q) || breedName.includes(q)
  })

  async function handleDelete() {
    if (!deleteId) return
    setDeleteError('')
    const litter = litters.find(l => l.id === deleteId)
    if (litter && litter.puppy_count && litter.puppy_count > 0) {
      setDeleteError('No se puede eliminar una camada con cachorros asignados.')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from('litters').delete().eq('id', deleteId)
    if (error) { setDeleteError(error.message); return }
    setDeleteId(null)
    router.refresh()
  }

  async function toggleVisibility(litter: Litter) {
    const supabase = createClient()
    await supabase.from('litters').update({ is_public: !litter.is_public }).eq('id', litter.id)
    router.refresh()
  }

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Camadas</h1>
        <p className="text-white/50 text-xs sm:text-sm mt-1">{litters.length} camadas</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por padre, madre o raza..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
        </div>
        <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
          <button onClick={() => changeView('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/30'}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => changeView('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/30'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      <p className="text-xs text-white/30 mb-3">{filtered.length} camada{filtered.length !== 1 ? 's' : ''}</p>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          <button onClick={openAdd}
            className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center hover:border-[#D74709]/40 hover:bg-white/[0.02] transition group cursor-pointer min-h-[160px] sm:min-h-[200px]">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/5 group-hover:bg-[#D74709]/10 flex items-center justify-center transition mb-3">
              <Plus className="w-6 h-6 text-white/30 group-hover:text-[#D74709] transition" />
            </div>
            <p className="text-sm text-white/40 group-hover:text-white/60 transition font-medium">Añadir camada</p>
          </button>

          {filtered.map(litter => {
            const father = litter.father as any
            const mother = litter.mother as any
            const breed = Array.isArray(litter.breed) ? litter.breed[0] : litter.breed
            const status = statusConfig[litter.status] || statusConfig.planned
            const hasPuppies = litter.puppy_count && litter.puppy_count > 0

            return (
              <div key={litter.id} className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition group">
                {/* Split parent photos */}
                <div className="relative flex h-32 bg-white/5">
                  <div className="flex-1 relative overflow-hidden">
                    {father?.thumbnail_url ? <img src={father.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-400/30 text-2xl">♂</div>}
                    <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-1.5 py-0.5 rounded">{father?.name || '?'}</div>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div className="flex-1 relative overflow-hidden">
                    {mother?.thumbnail_url ? <img src={mother.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-pink-400/30 text-2xl">♀</div>}
                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-1.5 py-0.5 rounded">{mother?.name || '?'}</div>
                  </div>
                  {/* Status badge on photo */}
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: status.color + '30', color: status.color, backdropFilter: 'blur(4px)' }}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {breed?.name && <span className="text-[10px] text-white/50 bg-white/5 rounded-full px-2 py-0.5">{breed.name}</span>}
                    <button onClick={() => toggleVisibility(litter)} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition ${litter.is_public ? 'text-green-400 bg-green-500/10' : 'text-white/30 bg-white/5'}`}>
                      {litter.is_public ? <Globe className="w-3 h-3 inline mr-0.5" /> : <Lock className="w-3 h-3 inline mr-0.5" />}
                      {litter.is_public ? 'Publica' : 'Privada'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-white/40">
                    {litter.birth_date && <span>{new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    {litter.mating_date && !litter.birth_date && <span>Cruce: {new Date(litter.mating_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>}
                    {hasPuppies && <span>{litter.puppy_count} cachorros</span>}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
                    <Link href={`/litters/${litter.id}`} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition">
                      <Eye className="w-3 h-3" /> Ver
                    </Link>
                    <button onClick={() => openEdit(litter.id)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-white/30 hover:bg-white/10 transition">
                      <Edit className="w-3 h-3" /> Editar
                    </button>
                    {!hasPuppies && (
                      <button onClick={() => { setDeleteError(''); setDeleteId(litter.id) }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-red-400/50 hover:bg-red-500/10 hover:text-red-400 transition ml-auto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <button onClick={openAdd}
            className="w-full flex items-center gap-3 border-2 border-dashed border-white/10 rounded-xl p-3 sm:p-4 hover:border-[#D74709]/40 hover:bg-white/[0.02] transition group cursor-pointer">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 group-hover:bg-[#D74709]/10 flex items-center justify-center transition shrink-0">
              <Plus className="w-5 h-5 text-white/30 group-hover:text-[#D74709] transition" />
            </div>
            <p className="text-sm text-white/40 group-hover:text-white/60 transition font-medium">Añadir camada</p>
          </button>
          {filtered.map(litter => {
            const father = litter.father as any
            const mother = litter.mother as any
            const status = statusConfig[litter.status] || statusConfig.planned
            const hasPuppies = litter.puppy_count && litter.puppy_count > 0
            return (
              <div key={litter.id} className="flex items-center gap-2.5 sm:gap-4 bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-4 hover:border-[#D74709]/50 hover:bg-white/[0.07] transition cursor-pointer" onClick={() => window.location.href = `/litters/${litter.id}`}>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 overflow-hidden bg-white/5" style={{ borderColor: BRAND.male }}>
                    {father?.thumbnail_url ? <img src={father.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-400/30 text-xs">♂</div>}
                  </div>
                  <span className="text-white/20 text-xs">x</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 overflow-hidden bg-white/5" style={{ borderColor: BRAND.female }}>
                    {mother?.thumbnail_url ? <img src={mother.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-pink-400/30 text-xs">♀</div>}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{father?.name || '?'} x {mother?.name || '?'}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
                    {litter.birth_date && <span>{new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    {hasPuppies && <span>{litter.puppy_count} cachorros</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: status.color + '20', color: status.color }}>{status.label}</span>
                  <Link href={`/litters/${litter.id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition"><Eye className="w-3 h-3" /> <span className="hidden sm:inline">Ver</span></Link>
                  <button onClick={e => { e.stopPropagation(); openEdit(litter.id) }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-white/30 hover:bg-white/10 transition"><Edit className="w-3 h-3" /> <span className="hidden sm:inline">Editar</span></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Litter form panel */}
      <LitterFormPanel
        open={panelOpen}
        onClose={closePanel}
        editLitterId={editLitterId}
        userId={userId}
        onAddPuppy={(litterId, breedId, fatherId, motherId) => {
          closePanel()
          setAddPuppyLitterId(litterId)
          setAddPuppyBreedId(breedId)
          setAddPuppyFatherId(fatherId)
          setAddPuppyMotherId(motherId)
          setAddPuppyKennelId(userKennelId || null)
          setDogPanelOpen(true)
        }}
      />

      {/* Dog form panel for adding puppy to litter */}
      <DogFormPanel
        open={dogPanelOpen}
        onClose={() => { setDogPanelOpen(false); setAddPuppyLitterId(null); setAddPuppyFatherId(null); setAddPuppyMotherId(null); setAddPuppyKennelId(null) }}
        editDogId={null}
        userId={userId}
        defaultLitterId={addPuppyLitterId}
        defaultBreedId={addPuppyBreedId}
        defaultFatherId={addPuppyFatherId}
        defaultMotherId={addPuppyMotherId}
        defaultKennelId={addPuppyKennelId}
        defaultKennelName={userKennelName}
        defaultAffixFormat={userAffixFormat}
      />

      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => { setDeleteId(null); setDeleteError('') }}
        onConfirm={handleDelete}
        title="Eliminar camada"
        message={deleteError || "Esta camada se eliminara permanentemente."}
        confirmLabel="Eliminar"
        destructive
      />
    </>
  )
}
