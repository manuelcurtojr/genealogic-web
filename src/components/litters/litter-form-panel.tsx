'use client'

import { useState, useEffect, useRef } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ChevronDown, Lock, Calendar, Heart, PawPrint, Plus, Dog } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { Portal } from '@/components/ui/portal'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

interface LitterFormPanelProps {
  open: boolean
  onClose: () => void
  editLitterId?: string | null
  userId: string
  onAddPuppy?: (litterId: string, breedId: string | null, fatherId: string | null, motherId: string | null) => void
}

const STATUSES = [
  { value: 'planned', label: 'Solo Planificada', desc: 'Aun no se ha realizado el cruce.', icon: Calendar, color: '#3498db' },
  { value: 'mated', label: 'Cruce Realizado', desc: 'A la espera de confirmacion / parto.', icon: Heart, color: '#f39c12' },
  { value: 'born', label: 'Ya han nacido!', desc: 'Tengo la fecha y el numero de crias.', icon: PawPrint, color: '#27ae60' },
]

export default function LitterFormPanel({ open, onClose, editLitterId, userId, onAddPuppy }: LitterFormPanelProps) {
  const t = useT()
  const router = useRouter()
  const isEdit = !!editLitterId
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState('')

  const [breeds, setBreeds] = useState<any[]>([])
  const [maleDogs, setMaleDogs] = useState<any[]>([])
  const [femaleDogs, setFemaleDogs] = useState<any[]>([])
  const [puppies, setPuppies] = useState<any[]>([])

  const [form, setForm] = useState({
    father_id: '', mother_id: '', breed_id: '', birth_date: '', mating_date: '',
    puppy_count: '', status: 'planned', is_public: true,
  })

  useEffect(() => {
    if (!open) return
    setDataLoading(true)
    setError('')

    const supabase = createClient()
    async function load() {
      const [bRes, mRes, fRes] = await Promise.all([
        supabase.from('breeds').select('id, name').order('name'),
        supabase.from('dogs').select('id, name, thumbnail_url, breed_id').eq('owner_id', userId).eq('sex', 'male').order('name'),
        supabase.from('dogs').select('id, name, thumbnail_url, breed_id').eq('owner_id', userId).eq('sex', 'female').order('name'),
      ])
      setBreeds(bRes.data || [])
      setMaleDogs(mRes.data || [])
      setFemaleDogs(fRes.data || [])

      if (editLitterId) {
        const [litterRes, puppiesRes] = await Promise.all([
          supabase.from('litters').select('*').eq('id', editLitterId).single(),
          supabase.from('dogs').select('id, name, sex, thumbnail_url, breed:breeds(name)').eq('father_id', editLitterId).order('name'),
        ])
        // Puppies: dogs whose father_id or mother_id matches the litter parents
        const litter = litterRes.data
        if (litter) {
          setForm({
            father_id: litter.father_id || '', mother_id: litter.mother_id || '',
            breed_id: litter.breed_id || '', birth_date: litter.birth_date || '',
            mating_date: litter.mating_date || '',
            puppy_count: litter.puppy_count?.toString() || '', status: litter.status || 'planned',
            is_public: litter.is_public ?? true,
          })
          // Fetch actual puppies (dogs with same father AND mother as the litter)
          if (litter.father_id && litter.mother_id) {
            const { data: pups } = await supabase.from('dogs')
              .select('id, name, sex, thumbnail_url')
              .eq('father_id', litter.father_id)
              .eq('mother_id', litter.mother_id)
              .order('name')
            setPuppies(pups || [])
          } else {
            setPuppies([])
          }
        }
      } else {
        setPuppies([])
        setForm({ father_id: '', mother_id: '', breed_id: '', birth_date: '', mating_date: '', puppy_count: '', status: 'planned', is_public: true })
      }
      setDataLoading(false)
    }
    load()
  }, [open, editLitterId, userId])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const filteredMales = form.breed_id ? maleDogs.filter(d => d.breed_id === form.breed_id) : maleDogs
  const filteredFemales = form.breed_id ? femaleDogs.filter(d => d.breed_id === form.breed_id) : femaleDogs

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const payload: any = {
      breed_id: form.breed_id || null,
      birth_date: form.birth_date || null,
      mating_date: form.mating_date || null,
      puppy_count: form.puppy_count ? parseInt(form.puppy_count) : null,
      status: form.status, is_public: form.is_public,
    }
    // Only set parents on create
    if (!isEdit) {
      payload.father_id = form.father_id || null
      payload.mother_id = form.mother_id || null
    }

    if (isEdit) {
      const { error: err } = await supabase.from('litters').update(payload).eq('id', editLitterId!)
      setLoading(false)
      if (err) { setError(err.message); return }
    } else {
      const { data: inserted, error: err } = await supabase
        .from('litters').insert({ ...payload, owner_id: userId })
        .select('id').single()
      setLoading(false)
      if (err) { setError(err.message); return }
      // Notificar a la lista de espera (best-effort, no bloquea cierre)
      if (inserted?.id) {
        fetch('/api/email/notify-litter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ litterId: inserted.id }),
        }).catch(() => { /* swallow */ })
      }
    }
    onClose()
    router.refresh()
  }

  return (
    <Portal>
      <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-lg z-[70] bg-white border-l border-hairline shadow-[-12px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
        style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">{isEdit ? t('Editar camada') : t('Nueva camada')}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition"><X className="w-5 h-5" /></button>
        </div>

        {dataLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

            {/* Breed — searchable like header */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{t('Raza')}</h3>
              <DogSearch
                label={t('Raza')}
                items={breeds.map(b => ({ id: b.id, name: b.name, image: null }))}
                value={form.breed_id}
                onChange={v => { set('breed_id', v); set('father_id', ''); set('mother_id', '') }}
                placeholder={t('Buscar raza...')}
              />
            </div>

            {/* Parents */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                {t('Padres')} {isEdit && <span className="text-muted normal-case">{t('(no editables)')}</span>}
              </h3>
              {isEdit ? (
                <div className="space-y-2">
                  <LockedField label={t('Padre')} dogs={maleDogs} value={form.father_id} sex="male" />
                  <LockedField label={t('Madre')} dogs={femaleDogs} value={form.mother_id} sex="female" />
                </div>
              ) : (
                <div className="space-y-3">
                  <DogSearch
                    label={t('Padre')}
                    items={filteredMales.map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))}
                    value={form.father_id}
                    onChange={v => set('father_id', v)}
                    placeholder={t('Buscar padre...')}
                    sexColor={BRAND.male}
                  />
                  <DogSearch
                    label={t('Madre')}
                    items={filteredFemales.map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))}
                    value={form.mother_id}
                    onChange={v => set('mother_id', v)}
                    placeholder={t('Buscar madre...')}
                    sexColor={BRAND.female}
                  />
                </div>
              )}
            </div>

            {/* Status — 3 cards with inline fields */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{t('Estado actual')}</h3>
              <div className="space-y-2">
                {STATUSES.map(s => {
                  const Icon = s.icon
                  const active = form.status === s.value
                  return (
                    <div key={s.value}>
                      <button type="button" onClick={() => set('status', s.value)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition ${
                          active ? 'border-ink bg-surface-soft' : 'border-hairline bg-canvas hover:bg-surface-soft'
                        }`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-surface-card' : 'bg-surface-card'}`}>
                          <Icon className="w-5 h-5" style={{ color: active ? '#fb923c' : s.color }} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${active ? 'text-ink' : 'text-ink'}`}>{t(s.label)}</p>
                          <p className="text-xs text-muted">{t(s.desc)}</p>
                        </div>
                      </button>

                      {/* Mated fields — inline below its card */}
                      {active && s.value === 'mated' && (
                        <div className="mt-2 ml-4 pl-4 border-l-2 border-hairline space-y-3 pb-1">
                          <div>
                            <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">{t('Fecha del cruce')}</label>
                            <input type="date" value={form.mating_date} onChange={e => set('mating_date', e.target.value)}
                              className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition" />
                          </div>
                        </div>
                      )}

                      {/* Born fields — inline below its card */}
                      {active && s.value === 'born' && (
                        <div className="mt-2 ml-4 pl-4 border-l-2 border-hairline space-y-3 pb-1">
                          <div>
                            <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">{t('Fecha del cruce')}</label>
                            <input type="date" value={form.mating_date} onChange={e => set('mating_date', e.target.value)}
                              className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">{t('Nacimiento')}</label>
                              <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)}
                                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">{t('Cachorros')}</label>
                              <input type="number" min="0" value={form.puppy_count} onChange={e => set('puppy_count', e.target.value)}
                                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between bg-surface-card border border-hairline rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">{t('Camada publica')}</p>
                <p className="text-xs text-muted">{t('Visible para otros usuarios')}</p>
              </div>
              <ToggleSwitch value={form.is_public} onChange={(v) => set('is_public', v)} />
            </div>

            {/* Puppies section (edit mode only) */}
            {isEdit && (
              <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                  {t('Cachorros')} {puppies.length > 0 && <span className="text-muted">({puppies.length})</span>}
                </h3>
                {puppies.length > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {puppies.map((pup: any) => {
                      const sexColor = pup.sex === 'male' ? '#017DFA' : '#e84393'
                      return (
                        <Link key={pup.id} href={`/dogs/${pup.slug || pup.id}`}
                          className="flex items-center gap-2.5 bg-surface-card border border-hairline rounded-lg px-3 py-2 hover:border-white/15 transition">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-card flex-shrink-0 border" style={{ borderColor: sexColor }}>
                            {pup.thumbnail_url ? <img src={pup.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Dog className="w-4 h-4 text-muted" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{pup.name}</p>
                          </div>
                          <span className="text-[10px]" style={{ color: sexColor }}>{pup.sex === 'male' ? '♂' : '♀'}</span>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted mb-3">{t('No hay cachorros asignados a esta camada')}</p>
                )}
                <button
                  type="button"
                  onClick={() => onAddPuppy?.(editLitterId!, form.breed_id || null, form.father_id || null, form.mother_id || null)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-hairline text-xs text-muted hover:text-ink hover:border-hairline transition"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('Añadir cachorro')}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-hairline flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-body hover:text-ink hover:bg-surface-card transition">{t('Cancelar')}</button>
          <button onClick={handleSubmit} disabled={loading || dataLoading}
            className="bg-ink text-on-primary hover:opacity-90 font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('Guardando...') : isEdit ? t('Guardar cambios') : t('Crear camada')}
          </button>
        </div>
      </div>
      </>
    </Portal>
  )
}

/* --- Unified search selector (like header search bar) --- */
function DogSearch({ label, items, value, onChange, placeholder, sexColor }: {
  label: string; items: { id: string; name: string; image: string | null }[]; value: string; onChange: (v: string) => void; placeholder?: string; sexColor?: string
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = items.find(d => d.id === value)
  const filtered = items.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">{label}</label>
      <div onClick={() => { setOpen(!open); setSearch('') }}
        className={`w-full bg-canvas border rounded-lg px-3 py-2.5 text-[14px] flex items-center gap-2 cursor-pointer transition-colors hover:bg-surface-soft ${open ? 'border-ink ring-1 ring-ink' : 'border-hairline'}`}>
        {selected ? (
          <>
            {selected.image && (
              <div className="w-6 h-6 rounded-full border-2 overflow-hidden flex-shrink-0 bg-surface-card" style={{ borderColor: sexColor || BRAND.primary }}>
                <img src={selected.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <span className="flex-1 truncate text-ink">{selected.name}</span>
          </>
        ) : (
          <span className="text-muted flex-1">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-muted hover:text-body"><X className="w-3.5 h-3.5" /></span>}
          <ChevronDown className={`w-4 h-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="absolute z-[80] mt-1 flex max-h-72 w-full flex-col overflow-hidden rounded-lg border border-hairline bg-canvas shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="border-b border-hairline p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('Buscar...')}
                className="w-full rounded border border-hairline bg-canvas py-1.5 pl-8 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-3 text-center text-[13px] text-muted">{t('Sin resultados')}</p>
            ) : (
              filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onChange(item.id); setOpen(false); setSearch('') }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors ${
                    item.id === value ? 'bg-surface-card text-ink font-medium' : 'text-body hover:bg-surface-soft hover:text-ink'
                  }`}
                >
                  {item.image !== null && (
                    <div
                      className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border-2 bg-surface-card"
                      style={{ borderColor: sexColor || BRAND.primary }}
                    >
                      {item.image
                        ? <img src={item.image} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center"><img src="/icon.svg?v=2" alt="" className="h-3.5 w-3.5 opacity-30" /></div>
                      }
                    </div>
                  )}
                  <span className="truncate">{item.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LockedField({ label, dogs, value, sex }: { label: string; dogs: any[]; value: string; sex: string }) {
  const t = useT()
  const dog = dogs.find(d => d.id === value)
  const sexColor = sex === 'male' ? BRAND.male : BRAND.female
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{label}</label>
      <div className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5 text-[14px]">
        {dog ? (
          <>
            <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border-2 bg-surface-card" style={{ borderColor: sexColor }}>
              {dog.thumbnail_url
                ? <img src={dog.thumbnail_url} alt="" className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">{sex === 'male' ? '♂' : '♀'}</div>
              }
            </div>
            <span className="truncate text-ink">{dog.name}</span>
          </>
        ) : (
          <span className="text-muted">{t('No asignado')}</span>
        )}
        <Lock className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-muted" />
      </div>
    </div>
  )
}
