'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Grid3X3, List, Trash2, Edit, Eye, Lock, Globe } from 'lucide-react'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import { useT } from '@/components/i18n/locale-provider'
import SortSelect, { useSortPreference, sortItems } from '@/components/ui/sort-select'
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

// Status — usa pastels Cal en lugar de #colors crudos
const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planificada', color: '#3b82f6' },
  mated: { label: 'Cubrición', color: '#f59e0b' },
  born: { label: 'Nacida', color: '#34d399' },
  confirmed: { label: 'Nacida', color: '#34d399' },
  pending: { label: 'Cubrición', color: '#f59e0b' },
}

export default function LittersPageClient({
  litters, userId, userKennelId, userKennelName, userAffixFormat,
}: { litters: Litter[]; userId: string; userKennelId?: string | null; userKennelName?: string | null; userAffixFormat?: string | null }) {
  const t = useT()
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
  const [dogPanelOpen, setDogPanelOpen] = useState(false)
  const [addPuppyLitterId, setAddPuppyLitterId] = useState<string | null>(null)
  const [addPuppyBreedId, setAddPuppyBreedId] = useState<string | null>(null)
  const [addPuppyFatherId, setAddPuppyFatherId] = useState<string | null>(null)
  const [addPuppyMotherId, setAddPuppyMotherId] = useState<string | null>(null)
  const [addPuppyKennelId, setAddPuppyKennelId] = useState<string | null>(null)
  const router = useRouter()

  const [sortBy, setSortBy] = useSortPreference('litters-sort')
  const openAdd = () => { setEditLitterId(null); setPanelOpen(true) }
  const openEdit = (id: string) => { setEditLitterId(id); setPanelOpen(true) }
  const closePanel = () => { setPanelOpen(false); setEditLitterId(null) }

  // Auto-abrir el panel de creación cuando se llega con ?new=1 (legacy
  // /litters/new redirige aquí). Limpia el query param para no reabrirlo.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('new') === '1') {
      setEditLitterId(null)
      setPanelOpen(true)
      const url = new URL(window.location.href)
      url.searchParams.delete('new')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const filtered = litters.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    const fName = (l.father as any)?.name?.toLowerCase() || ''
    const mName = (l.mother as any)?.name?.toLowerCase() || ''
    const breedName = (Array.isArray(l.breed) ? l.breed[0]?.name : l.breed?.name)?.toLowerCase() || ''
    return fName.includes(q) || mName.includes(q) || breedName.includes(q)
  })

  const sorted = sortBy === 'alpha'
    ? [...filtered].sort((a, b) => ((a.father as any)?.name || '').localeCompare((b.father as any)?.name || '', 'es', { sensitivity: 'base' }))
    : sortItems(filtered, sortBy)

  async function handleDelete() {
    if (!deleteId) return
    setDeleteError('')
    const litter = litters.find(l => l.id === deleteId)
    if (litter && litter.puppy_count && litter.puppy_count > 0) {
      setDeleteError(t('No se puede eliminar una camada con cachorros asignados.'))
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
    <div className="space-y-6 sm:space-y-8">
      {/* PageHeader Cal */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Crianza')}</p>
          <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            {t('Camadas')}
          </h1>
          <p className="mt-2 text-[14px] text-body">{litters.length} {litters.length === 1 ? t('camada') : t('camadas')}</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> {t('Camada')}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Buscar por padre, madre o raza...')}
            className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-4 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
          />
        </div>
        <SortSelect value={sortBy} onChange={setSortBy} storageKey="litters-sort" />
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-hairline">
          <button
            onClick={() => changeView('grid')}
            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-ink text-on-primary' : 'bg-canvas text-muted hover:bg-surface-soft hover:text-ink'}`}
            title={t('Vista grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => changeView('list')}
            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-ink text-on-primary' : 'bg-canvas text-muted hover:bg-surface-soft hover:text-ink'}`}
            title={t('Vista lista')}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="-mt-3 text-[12.5px] text-muted">
        {t('Mostrando')} {sorted.length} {t('de')} {filtered.length} {filtered.length === 1 ? t('camada') : t('camadas')}
      </p>

      {/* Grid view */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          <button
            onClick={openAdd}
            className="group flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface-soft transition-colors hover:bg-surface-card sm:min-h-[220px]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-canvas transition-colors group-hover:border-ink group-hover:bg-ink sm:h-14 sm:w-14">
              <Plus className="h-5 w-5 text-muted transition-colors group-hover:text-on-primary sm:h-6 sm:w-6" />
            </div>
            <p className="mt-3 text-[13px] font-medium text-body">{t('Añadir camada')}</p>
          </button>

          {sorted.map(litter => {
            const father = litter.father as any
            const mother = litter.mother as any
            const breed = Array.isArray(litter.breed) ? litter.breed[0] : litter.breed
            const status = statusConfig[litter.status] || statusConfig.planned
            const hasPuppies = litter.puppy_count && litter.puppy_count > 0

            return (
              <div key={litter.id} className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft">
                {/* Split parent photos */}
                <div className="relative flex h-32 bg-surface-card">
                  <div className="relative flex-1 overflow-hidden">
                    {father?.thumbnail_url
                      ? <img src={father.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-2xl text-muted">♂</div>
                    }
                    <div className="absolute bottom-1.5 left-1.5 rounded bg-canvas px-1.5 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                      {father?.name || '?'}
                    </div>
                  </div>
                  <div className="w-px bg-hairline" />
                  <div className="relative flex-1 overflow-hidden">
                    {mother?.thumbnail_url
                      ? <img src={mother.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-2xl text-muted">♀</div>
                    }
                    <div className="absolute bottom-1.5 right-1.5 rounded bg-canvas px-1.5 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                      {mother?.name || '?'}
                    </div>
                  </div>
                  <div className="absolute right-2 top-2">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                      style={{ backgroundColor: status.color }}
                    >
                      {t(status.label)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {breed?.name && (
                      <span className="rounded-full bg-surface-card px-2 py-0.5 text-[10.5px] font-medium text-body">
                        {breed.name}
                      </span>
                    )}
                    <button
                      onClick={() => toggleVisibility(litter)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                        litter.is_public
                          ? 'bg-[color:var(--success)]/10 text-[color:var(--success)] hover:bg-[color:var(--success)]/15'
                          : 'bg-surface-card text-muted hover:text-ink'
                      }`}
                    >
                      {litter.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {litter.is_public ? t('Pública') : t('Privada')}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[11.5px] text-muted">
                    {litter.birth_date && (
                      <span>{new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    )}
                    {litter.mating_date && !litter.birth_date && (
                      <span>{t('Cruce:')} {new Date(litter.mating_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                    )}
                    {hasPuppies && <span>{litter.puppy_count} {t('cachorros')}</span>}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-1.5 border-t border-hairline pt-3">
                    <Link
                      href={`/litters/${litter.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1.5 text-[11px] font-medium text-on-primary transition-colors hover:opacity-90"
                    >
                      <Eye className="h-3.5 w-3.5" /> {t('Ver')}
                    </Link>
                    <button
                      onClick={() => openEdit(litter.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-[11px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
                    >
                      <Edit className="h-3.5 w-3.5" /> {t('Editar')}
                    </button>
                    {!hasPuppies && (
                      <button
                        onClick={() => { setDeleteError(''); setDeleteId(litter.id) }}
                        className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-soft hover:text-[color:var(--error)]"
                        title={t('Eliminar')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          <button
            onClick={openAdd}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-hairline bg-surface-soft p-3 transition-colors hover:bg-surface-card sm:p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas transition-colors group-hover:border-ink group-hover:bg-ink">
              <Plus className="h-5 w-5 text-muted transition-colors group-hover:text-on-primary" />
            </div>
            <p className="text-[14px] font-medium text-body">{t('Añadir camada')}</p>
          </button>
          {sorted.map(litter => {
            const father = litter.father as any
            const mother = litter.mother as any
            const status = statusConfig[litter.status] || statusConfig.planned
            const hasPuppies = litter.puppy_count && litter.puppy_count > 0
            return (
              <div
                key={litter.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-hairline bg-canvas p-3 transition-colors hover:bg-surface-soft sm:gap-4 sm:p-4"
                onClick={() => window.location.href = `/litters/${litter.id}`}
              >
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <div className="h-10 w-10 overflow-hidden rounded-full border-2 bg-surface-card" style={{ borderColor: BRAND.male }}>
                    {father?.thumbnail_url ? <img src={father.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted">♂</div>}
                  </div>
                  <span className="text-[12px] text-muted">×</span>
                  <div className="h-10 w-10 overflow-hidden rounded-full border-2 bg-surface-card" style={{ borderColor: BRAND.female }}>
                    {mother?.thumbnail_url ? <img src={mother.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted">♀</div>}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">
                    {father?.name || '?'} × {mother?.name || '?'}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-[12px] text-muted">
                    {litter.birth_date && <span>{new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    {hasPuppies && <span>{litter.puppy_count} {t('cachorros')}</span>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium text-white"
                    style={{ backgroundColor: status.color }}
                  >
                    {t(status.label)}
                  </span>
                  <Link
                    href={`/litters/${litter.id}`}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1.5 text-[11px] font-medium text-on-primary transition-colors hover:opacity-90"
                  >
                    <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('Ver')}</span>
                  </Link>
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(litter.id) }}
                    className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-[11px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
                  >
                    <Edit className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('Editar')}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 && search && (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <p className="text-[14px] text-body">{t('No se encontraron camadas con esa búsqueda.')}</p>
          <button onClick={() => setSearch('')} className="mt-3 text-[13px] font-medium text-ink hover:opacity-80">
            {t('Limpiar búsqueda →')}
          </button>
        </div>
      )}

      {/* Panels */}
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
        title={t('Eliminar camada')}
        message={deleteError || t('Esta camada se eliminará permanentemente.')}
        confirmLabel={t('Eliminar')}
        destructive
      />
    </div>
  )
}
