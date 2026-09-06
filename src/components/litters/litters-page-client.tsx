'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Grid3X3, List, Table2, Trash2, Edit, Eye, Lock, Globe } from 'lucide-react'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import { useT } from '@/components/i18n/locale-provider'
import SortSelect, { useSortPreference, sortItems } from '@/components/ui/sort-select'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import LitterFormPanel from './litter-form-panel'
import DogFormPanel from '@/components/dogs/dog-form-panel'
import Drawer from '@/components/embudo/drawer'
import { Img } from '@/components/ui/img'

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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('litters-view') as 'grid' | 'list' | 'table') || 'grid'
    return 'grid'
  })
  const changeView = (v: 'grid' | 'list' | 'table') => { setViewMode(v); localStorage.setItem('litters-view', v) }
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
  const [addPuppyBirthDate, setAddPuppyBirthDate] = useState<string | null>(null)
  const router = useRouter()
  // Camada cuyo panel derecho de opciones está abierto (vista tabla).
  const [optionsLitterId, setOptionsLitterId] = useState<string | null>(null)

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

  // Camada activa del panel de opciones (se resuelve en vivo para reflejar cambios).
  const optionsLitter = optionsLitterId ? (litters.find((l) => l.id === optionsLitterId) ?? null) : null

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
          <button
            onClick={() => changeView('table')}
            className={`p-2.5 transition-colors ${viewMode === 'table' ? 'bg-ink text-on-primary' : 'bg-canvas text-muted hover:bg-surface-soft hover:text-ink'}`}
            title={t('Vista tabla')}
          >
            <Table2 className="h-4 w-4" />
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
                      ? <Img w={480} src={father.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-2xl text-muted">♂</div>
                    }
                    <div className="absolute bottom-1.5 left-1.5 rounded bg-canvas px-1.5 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                      {father?.name || '?'}
                    </div>
                  </div>
                  <div className="w-px bg-hairline" />
                  <div className="relative flex-1 overflow-hidden">
                    {mother?.thumbnail_url
                      ? <Img w={480} src={mother.thumbnail_url} alt="" className="h-full w-full object-cover" />
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
      ) : viewMode === 'table' ? (
        <LittersTable litters={sorted} onOpenOptions={(litter) => setOptionsLitterId(litter.id)} t={t} />
      ) : (
        /* List view */
        <div className="space-y-2">
          <button
            onClick={openAdd}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-hairline bg-surface-soft px-3 py-5 transition-colors hover:bg-surface-card sm:px-4"
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
                    {father?.thumbnail_url ? <Img w={120} src={father.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted">♂</div>}
                  </div>
                  <span className="text-[12px] text-muted">×</span>
                  <div className="h-10 w-10 overflow-hidden rounded-full border-2 bg-surface-card" style={{ borderColor: BRAND.female }}>
                    {mother?.thumbnail_url ? <Img w={120} src={mother.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted">♀</div>}
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
        onAddPuppy={(litterId, breedId, fatherId, motherId, birthDate) => {
          closePanel()
          setAddPuppyLitterId(litterId)
          setAddPuppyBreedId(breedId)
          setAddPuppyFatherId(fatherId)
          setAddPuppyMotherId(motherId)
          setAddPuppyKennelId(userKennelId || null)
          setAddPuppyBirthDate(birthDate)
          setDogPanelOpen(true)
        }}
      />

      <DogFormPanel
        open={dogPanelOpen}
        onClose={() => { setDogPanelOpen(false); setAddPuppyLitterId(null); setAddPuppyFatherId(null); setAddPuppyMotherId(null); setAddPuppyKennelId(null); setAddPuppyBirthDate(null) }}
        editDogId={null}
        userId={userId}
        defaultLitterId={addPuppyLitterId}
        defaultBreedId={addPuppyBreedId}
        defaultFatherId={addPuppyFatherId}
        defaultMotherId={addPuppyMotherId}
        defaultBirthDate={addPuppyBirthDate}
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

      {/* Panel derecho de opciones de la camada (vista tabla) */}
      {optionsLitter && (
        <LitterOptionsPanel
          litter={optionsLitter}
          t={t}
          onClose={() => setOptionsLitterId(null)}
          onView={() => { window.location.href = `/litters/${optionsLitter.id}` }}
          onEdit={() => { setOptionsLitterId(null); openEdit(optionsLitter.id) }}
          onToggleVisibility={() => toggleVisibility(optionsLitter)}
          onDelete={() => { setOptionsLitterId(null); setDeleteError(''); setDeleteId(optionsLitter.id) }}
        />
      )}
    </div>
  )
}

/**
 * LittersTable — vista TABLA (tipo hoja de cálculo) de las camadas. Filas
 * densas y escaneables; clic en la fila abre la camada. Scroll horizontal
 * propio para no romper el ancho de la página.
 */
function LittersTable({ litters, onOpenOptions, t }: { litters: Litter[]; onOpenOptions: (litter: Litter) => void; t: (k: string) => string }) {
  if (litters.length === 0) return null
  const fmt = (d: string | null, withYear = true) =>
    d ? new Date(d).toLocaleDateString('es-ES', withYear ? { day: '2-digit', month: 'short', year: 'numeric' } : { day: '2-digit', month: 'short' }) : '—'
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-surface-soft/60 text-[10px] uppercase tracking-wider text-muted">
              <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">{t('Cruce')}</th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">{t('Raza')}</th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">{t('Estado')}</th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">{t('Nacimiento')}</th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">{t('Cubrición')}</th>
              <th className="whitespace-nowrap px-3 py-2 text-right font-semibold">{t('Cachorros')}</th>
              <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">{t('Visibilidad')}</th>
            </tr>
          </thead>
          <tbody>
            {litters.map((litter) => {
              const father = litter.father as any
              const mother = litter.mother as any
              const breed = Array.isArray(litter.breed) ? litter.breed[0] : litter.breed
              const status = statusConfig[litter.status] || statusConfig.planned
              return (
                <tr
                  key={litter.id}
                  onClick={() => onOpenOptions(litter)}
                  title={t('Ver opciones')}
                  className="cursor-pointer border-t border-hairline hover:bg-surface-soft/50"
                >
                  <td
                    className="group/cruce whitespace-nowrap px-3 py-2 font-semibold text-ink"
                    onClick={(e) => { e.stopPropagation(); window.location.href = `/litters/${litter.id}` }}
                    title={t('Ver camada')}
                  >
                    <span className="group-hover/cruce:underline">{father?.name || '?'} × {mother?.name || '?'}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink">{breed?.name || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium text-white" style={{ backgroundColor: status.color }}>{t(status.label)}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink">{fmt(litter.birth_date)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink">{fmt(litter.mating_date, false)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-ink">{litter.puppy_count ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {litter.is_public
                      ? <span className="inline-flex items-center gap-1 text-[color:var(--success)]"><Globe className="h-3 w-3" /> {t('Pública')}</span>
                      : <span className="inline-flex items-center gap-1 text-muted"><Lock className="h-3 w-3" /> {t('Privada')}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * LitterOptionsPanel — panel lateral derecho con las opciones de una camada
 * (ver, editar, visibilidad, eliminar). Se abre desde la vista tabla al
 * pinchar una fila fuera de la columna Cruce.
 */
function LitterOptionsPanel({
  litter, t, onClose, onView, onEdit, onToggleVisibility, onDelete,
}: {
  litter: Litter
  t: (k: string) => string
  onClose: () => void
  onView: () => void
  onEdit: () => void
  onToggleVisibility: () => void
  onDelete: () => void
}) {
  const father = litter.father as any
  const mother = litter.mother as any
  const breed = Array.isArray(litter.breed) ? litter.breed[0] : litter.breed
  const status = statusConfig[litter.status] || statusConfig.planned
  const hasPuppies = !!(litter.puppy_count && litter.puppy_count > 0)
  const actionCls = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink'
  return (
    <Drawer title={`${father?.name || '?'} × ${mother?.name || '?'}`} subtitle={breed?.name || undefined} onClose={onClose}>
      <div className="space-y-4">
        {/* Resumen */}
        <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-soft/40 p-3">
          <div className="flex flex-shrink-0 items-center gap-1">
            <div className="h-11 w-11 overflow-hidden rounded-full border-2 bg-surface-card" style={{ borderColor: BRAND.male }}>
              {father?.thumbnail_url ? <Img w={120} src={father.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted">♂</div>}
            </div>
            <span className="text-[12px] text-muted">×</span>
            <div className="h-11 w-11 overflow-hidden rounded-full border-2 bg-surface-card" style={{ borderColor: BRAND.female }}>
              {mother?.thumbnail_url ? <Img w={120} src={mother.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted">♀</div>}
            </div>
          </div>
          <div className="min-w-0">
            <span className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium text-white" style={{ backgroundColor: status.color }}>{t(status.label)}</span>
            <p className="mt-1 text-[12.5px] text-muted">
              {[
                litter.birth_date ? new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
                hasPuppies ? `${litter.puppy_count} ${t('cachorros')}` : null,
              ].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
        </div>

        {/* Ver (acción primaria) */}
        <button onClick={onView} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90">
          <Eye className="h-4 w-4" /> {t('Ver camada')}
        </button>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onEdit} className={actionCls}><Edit className="h-3.5 w-3.5" /> {t('Editar')}</button>
          <button
            onClick={onToggleVisibility}
            aria-pressed={litter.is_public}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors ${litter.is_public ? 'border-emerald-400/60 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-hairline bg-canvas text-muted hover:bg-surface-soft hover:text-ink'}`}
          >
            {litter.is_public ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} {litter.is_public ? t('Pública') : t('Privada')}
          </button>
          <button
            onClick={onDelete}
            disabled={hasPuppies}
            title={hasPuppies ? t('No se puede eliminar una camada con cachorros asignados.') : undefined}
            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[13px] font-medium text-body transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-hairline disabled:hover:bg-canvas disabled:hover:text-body"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t('Eliminar')}
          </button>
        </div>
        {hasPuppies && (
          <p className="text-[11.5px] leading-snug text-muted">{t('No se puede eliminar una camada con cachorros asignados.')}</p>
        )}
      </div>
    </Drawer>
  )
}
