'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ChevronDown, Lock, Calendar, Heart, PawPrint, Plus, Dog } from 'lucide-react'
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
      const { error: err } = await supabase.from('litters').insert({ ...payload, owner_id: userId })
      setLoading(false)
      if (err) { setError(err.message); return }
    }
    onClose()
    router.refresh()
  }

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-lg z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">{isEdit ? 'Editar camada' : 'Nueva camada'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {dataLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

            {/* Breed — searchable like header */}
            <div>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Raza</h3>
              <DogSearch
                label="Raza"
                items={breeds.map(b => ({ id: b.id, name: b.name, image: null }))}
                value={form.breed_id}
                onChange={v => { set('breed_id', v); set('father_id', ''); set('mother_id', '') }}
                placeholder="Buscar raza..."
              />
            </div>

            {/* Parents */}
            <div>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
                Padres {isEdit && <span className="text-white/20 normal-case">(no editables)</span>}
              </h3>
              {isEdit ? (
                <div className="space-y-2">
                  <LockedField label="Padre" dogs={maleDogs} value={form.father_id} sex="male" />
                  <LockedField label="Madre" dogs={femaleDogs} value={form.mother_id} sex="female" />
                </div>
              ) : (
                <div className="space-y-3">
                  <DogSearch
                    label="Padre"
                    items={filteredMales.map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))}
                    value={form.father_id}
                    onChange={v => set('father_id', v)}
                    placeholder="Buscar padre..."
                    sexColor={BRAND.male}
                  />
                  <DogSearch
                    label="Madre"
                    items={filteredFemales.map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))}
                    value={form.mother_id}
                    onChange={v => set('mother_id', v)}
                    placeholder="Buscar madre..."
                    sexColor={BRAND.female}
                  />
                </div>
              )}
            </div>

            {/* Status — 3 cards with inline fields */}
            <div>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Estado actual</h3>
              <div className="space-y-2">
                {STATUSES.map(s => {
                  const Icon = s.icon
                  const active = form.status === s.value
                  return (
                    <div key={s.value}>
                      <button type="button" onClick={() => set('status', s.value)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition ${
                          active ? 'border-[#D74709] bg-[#D74709]/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                        }`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-[#D74709]/15' : 'bg-white/5'}`}>
                          <Icon className="w-5 h-5" style={{ color: active ? '#D74709' : s.color }} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${active ? 'text-[#D74709]' : 'text-white/70'}`}>{s.label}</p>
                          <p className="text-xs text-white/40">{s.desc}</p>
                        </div>
                      </button>

                      {/* Mated fields — inline below its card */}
                      {active && s.value === 'mated' && (
                        <div className="mt-2 ml-4 pl-4 border-l-2 border-[#D74709]/30 space-y-3 pb-1">
                          <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Fecha del cruce</label>
                            <input type="date" value={form.mating_date} onChange={e => set('mating_date', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition" />
                          </div>
                        </div>
                      )}

                      {/* Born fields — inline below its card */}
                      {active && s.value === 'born' && (
                        <div className="mt-2 ml-4 pl-4 border-l-2 border-[#D74709]/30 space-y-3 pb-1">
                          <div>
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Fecha del cruce</label>
                            <input type="date" value={form.mating_date} onChange={e => set('mating_date', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Nacimiento</label>
                              <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Cachorros</label>
                              <input type="number" min="0" value={form.puppy_count} onChange={e => set('puppy_count', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition" />
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
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">Camada publica</p>
                <p className="text-xs text-white/40">Visible para otros usuarios</p>
              </div>
              <button type="button" onClick={() => set('is_public', !form.is_public)}
                className={`w-10 h-5 rounded-full transition relative ${form.is_public ? 'bg-[#D74709]' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition ${form.is_public ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Puppies section (edit mode only) */}
            {isEdit && (
              <div>
                <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
                  Cachorros {puppies.length > 0 && <span className="text-white/20">({puppies.length})</span>}
                </h3>
                {puppies.length > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {puppies.map((pup: any) => {
                      const sexColor = pup.sex === 'male' ? '#017DFA' : '#e84393'
                      return (
                        <Link key={pup.id} href={`/dogs/${pup.id}`}
                          className="flex items-center gap-2.5 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 hover:border-white/15 transition">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border" style={{ borderColor: sexColor }}>
                            {pup.thumbnail_url ? <img src={pup.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Dog className="w-4 h-4 text-white/15" /></div>}
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
                  <p className="text-xs text-white/25 mb-3">No hay cachorros asignados a esta camada</p>
                )}
                <button
                  type="button"
                  onClick={() => onAddPuppy?.(editLitterId!, form.breed_id || null, form.father_id || null, form.mother_id || null)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/10 text-xs text-white/40 hover:text-[#D74709] hover:border-[#D74709]/30 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir cachorro
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || dataLoading}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear camada'}
          </button>
        </div>
      </div>
    </>
  )
}

/* --- Unified search selector (like header search bar) --- */
function DogSearch({ label, items, value, onChange, placeholder, sexColor }: {
  label: string; items: { id: string; name: string; image: string | null }[]; value: string; onChange: (v: string) => void; placeholder?: string; sexColor?: string
}) {
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
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <div onClick={() => { setOpen(!open); setSearch('') }}
        className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 cursor-pointer transition hover:border-white/20 ${open ? 'border-[#D74709]' : 'border-white/10'}`}>
        {selected ? (
          <>
            {selected.image && (
              <div className="w-6 h-6 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor || BRAND.primary }}>
                <img src={selected.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <span className="text-white flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-white/30 flex-1">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></span>}
          <ChevronDown className={`w-4 h-4 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="absolute z-[80] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-52 flex flex-col">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? <p className="text-sm text-white/30 p-3 text-center">Sin resultados</p> : filtered.map(item => (
              <button key={item.id} type="button" onClick={() => { onChange(item.id); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition ${item.id === value ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/70 hover:bg-white/5'}`}>
                {item.image !== null && (
                  <div className="w-7 h-7 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor || BRAND.primary }}>
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-3.5 h-3.5 opacity-30" /></div>}
                  </div>
                )}
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LockedField({ label, dogs, value, sex }: { label: string; dogs: any[]; value: string; sex: string }) {
  const dog = dogs.find(d => d.id === value)
  const sexColor = sex === 'male' ? BRAND.male : BRAND.female
  return (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 opacity-60 cursor-not-allowed">
        {dog ? (
          <>
            <div className="w-6 h-6 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
              {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">{sex === 'male' ? '♂' : '♀'}</div>}
            </div>
            <span className="text-white truncate">{dog.name}</span>
          </>
        ) : (
          <span className="text-white/30">No asignado</span>
        )}
        <Lock className="w-3.5 h-3.5 text-white/20 ml-auto flex-shrink-0" />
      </div>
    </div>
  )
}
