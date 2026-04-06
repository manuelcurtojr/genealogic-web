'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ChevronDown, Mars, Venus } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface DogFormPanelProps {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  editDogId?: string | null
  userId: string
  defaultLitterId?: string | null
  defaultBreedId?: string | null
}

export default function DogFormPanel({ open, onClose, onSaved, editDogId, userId, defaultLitterId, defaultBreedId }: DogFormPanelProps) {
  const router = useRouter()
  const isEdit = !!editDogId
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState('')

  // Reference data — loaded on open
  const [breeds, setBreeds] = useState<any[]>([])
  const [colors, setColors] = useState<any[]>([])
  const [allColors, setAllColors] = useState<any[]>([])
  const [kennels, setKennels] = useState<any[]>([])
  const [maleDogs, setMaleDogs] = useState<any[]>([])
  const [femaleDogs, setFemaleDogs] = useState<any[]>([])
  const [allMaleDogs, setAllMaleDogs] = useState<any[]>([])
  const [allFemaleDogs, setAllFemaleDogs] = useState<any[]>([])

  const [form, setForm] = useState({
    name: '', sex: 'male', birth_date: '', registration: '', microchip: '',
    weight: '', height: '', breed_id: '', color_id: '', kennel_id: '',
    father_id: '', mother_id: '', is_public: true,
  })

  // Load reference data + edit data when panel opens
  useEffect(() => {
    if (!open) return
    setDataLoading(true)
    setError('')

    const supabase = createClient()

    async function load() {
      const [breedsRes, colorsRes, kennelsRes, malesRes, femalesRes] = await Promise.all([
        supabase.from('breeds').select('id, name').order('name'),
        supabase.from('colors').select('id, name, breed_id').order('name'),
        supabase.from('kennels').select('id, name').eq('owner_id', userId).order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('owner_id', userId).eq('sex', 'male').order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('owner_id', userId).eq('sex', 'female').order('name'),
      ])

      setBreeds(breedsRes.data || [])
      setAllColors(colorsRes.data || [])
      setColors(colorsRes.data || [])
      setKennels(kennelsRes.data || [])
      setAllMaleDogs(malesRes.data || [])
      setAllFemaleDogs(femalesRes.data || [])
      setMaleDogs(malesRes.data || [])
      setFemaleDogs(femalesRes.data || [])

      // If editing, load dog data
      if (editDogId) {
        const { data: dog } = await supabase.from('dogs').select('*').eq('id', editDogId).single()
        if (dog) {
          setForm({
            name: dog.name || '', sex: dog.sex || 'male',
            birth_date: dog.birth_date || '', registration: dog.registration || '',
            microchip: dog.microchip || '', weight: dog.weight?.toString() || '',
            height: dog.height?.toString() || '', breed_id: dog.breed_id || '',
            color_id: dog.color_id || '', kennel_id: dog.kennel_id || '',
            father_id: dog.father_id || '', mother_id: dog.mother_id || '',
            is_public: dog.is_public ?? true,
          })
          // Filter by breed if set
          if (dog.breed_id) {
            filterByBreed(dog.breed_id, colorsRes.data || [], malesRes.data || [], femalesRes.data || [])
          }
        }
      } else {
        setForm({ name: '', sex: 'male', birth_date: '', registration: '', microchip: '', weight: '', height: '', breed_id: defaultBreedId || '', color_id: '', kennel_id: '', father_id: '', mother_id: '', is_public: true })
        if (defaultBreedId) {
          filterByBreed(defaultBreedId, colorsRes.data || [], malesRes.data || [], femalesRes.data || [])
        }
      }

      setDataLoading(false)
    }
    load()
  }, [open, editDogId, userId])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  function filterByBreed(breedId: string, colorsData?: any[], malesData?: any[], femalesData?: any[]) {
    const c = colorsData || allColors
    const m = malesData || allMaleDogs
    const f = femalesData || allFemaleDogs

    if (!breedId) {
      setColors(c)
      setMaleDogs(m)
      setFemaleDogs(f)
    } else {
      // Filter colors: show those with matching breed_id or no breed_id (generic)
      setColors(c.filter((cl: any) => !cl.breed_id || cl.breed_id === breedId))
      // Filter dogs by breed
      setMaleDogs(m.filter((d: any) => d.breed_id === breedId))
      setFemaleDogs(f.filter((d: any) => d.breed_id === breedId))
    }
  }

  const set = (field: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // When breed changes, filter colors and dogs, reset dependent fields
      if (field === 'breed_id') {
        filterByBreed(value)
        next.color_id = ''
        next.father_id = ''
        next.mother_id = ''
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      name: form.name.trim(), sex: form.sex,
      birth_date: form.birth_date || null, registration: form.registration || null,
      microchip: form.microchip || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      breed_id: form.breed_id || null, color_id: form.color_id || null,
      kennel_id: form.kennel_id || null, father_id: form.father_id || null,
      mother_id: form.mother_id || null, is_public: form.is_public,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('dogs').update(payload).eq('id', editDogId!)
      setLoading(false)
      if (err) { setError(err.message); return }
    } else {
      const { error: err } = await supabase.from('dogs').insert({ ...payload, owner_id: userId })
      setLoading(false)
      if (err) { setError(err.message); return }
    }

    onClose()
    if (onSaved) onSaved()
    router.refresh()
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Fixed header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">{isEdit ? 'Editar perro' : defaultLitterId ? 'Anadir cachorro' : 'Anadir perro'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        {dataLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">{error}</div>}

            {/* Basic */}
            <Section title="Datos basicos">
              <Field label="Nombre *" value={form.name} onChange={v => set('name', v)} />
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Sexo *</label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map(s => (
                    <button key={s} type="button" onClick={() => set('sex', s)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                        form.sex === s
                          ? s === 'male' ? 'border-blue-400 bg-blue-400/10 text-blue-400' : 'border-pink-400 bg-pink-400/10 text-pink-400'
                          : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                      }`}>
                      {s === 'male' ? '♂ Macho' : '♀ Hembra'}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Fecha de nacimiento" value={form.birth_date} onChange={v => set('birth_date', v)} type="date" />
            </Section>

            {/* Breed first — then color and parents filter by breed */}
            <Section title="Raza y color">
              <AutocompleteSelect
                label="Raza *"
                options={breeds.map(b => ({ value: b.id, label: b.name }))}
                value={form.breed_id}
                onChange={v => set('breed_id', v)}
                placeholder="Buscar raza..."
              />
              <AutocompleteSelect
                label="Color"
                options={colors.map(c => ({ value: c.id, label: c.name }))}
                value={form.color_id}
                onChange={v => set('color_id', v)}
                placeholder={form.breed_id ? 'Buscar color...' : 'Selecciona raza primero'}
                disabled={!form.breed_id}
              />
            </Section>

            {/* Kennel */}
            <Section title="Criadero">
              <AutocompleteSelect
                label="Criadero"
                options={kennels.map(k => ({ value: k.id, label: k.name }))}
                value={form.kennel_id}
                onChange={v => set('kennel_id', v)}
                placeholder="Buscar criadero..."
              />
            </Section>

            {/* Parents — filtered by breed */}
            <Section title="Padres">
              <DogAutocomplete
                label="Padre"
                dogs={maleDogs.filter(d => d.id !== editDogId)}
                value={form.father_id}
                onChange={v => set('father_id', v)}
                placeholder={form.breed_id ? 'Buscar padre...' : 'Selecciona raza primero'}
                disabled={!form.breed_id}
              />
              <DogAutocomplete
                label="Madre"
                dogs={femaleDogs.filter(d => d.id !== editDogId)}
                value={form.mother_id}
                onChange={v => set('mother_id', v)}
                placeholder={form.breed_id ? 'Buscar madre...' : 'Selecciona raza primero'}
                disabled={!form.breed_id}
              />
            </Section>

            {/* Identification */}
            <Section title="Identificacion">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Registro" value={form.registration} onChange={v => set('registration', v)} placeholder="UKC, FCI..." />
                <Field label="Microchip" value={form.microchip} onChange={v => set('microchip', v)} />
              </div>
            </Section>

            {/* Measurements */}
            <Section title="Medidas">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Peso (kg)" value={form.weight} onChange={v => set('weight', v)} type="number" />
                <Field label="Altura (cm)" value={form.height} onChange={v => set('height', v)} type="number" />
              </div>
            </Section>

            {/* Visibility */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">Perfil publico</p>
                <p className="text-xs text-white/40">Otros usuarios podran ver este perro</p>
              </div>
              <button type="button" onClick={() => set('is_public', !form.is_public)}
                className={`w-10 h-5 rounded-full transition relative ${form.is_public ? 'bg-[#D74709]' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition ${form.is_public ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Fixed footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name.trim() || dataLoading}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear perro'}
          </button>
        </div>
      </div>
    </>
  )
}

/* --- Helper components --- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}

/* Autocomplete for breeds, colors, kennels */
function AutocompleteSelect({ label, options, value, onChange, placeholder, disabled }: {
  label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <div
        onClick={() => { if (!disabled) { setOpen(!open); setSearch('') } }}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer transition ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/20'}`}
      >
        <span className={selected ? 'text-white' : 'text-white/30'}>{selected?.label || placeholder}</span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-white/30 hover:text-white/60">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute z-[60] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-52 flex flex-col">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-white/30 p-3 text-center">Sin resultados</p>
            ) : filtered.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-2 text-sm transition ${opt.value === value ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/70 hover:bg-white/5'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* Dog autocomplete with photo */
function DogAutocomplete({ label, dogs, value, onChange, placeholder, disabled }: {
  label: string; dogs: any[]; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = dogs.find(d => d.id === value)
  const filtered = dogs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  const sexColor = label === 'Padre' ? BRAND.male : BRAND.female

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <div
        onClick={() => { if (!disabled) { setOpen(!open); setSearch('') } }}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 cursor-pointer transition ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/20'}`}
      >
        {selected ? (
          <>
            <div className="w-6 h-6 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
              {selected.thumbnail_url ? (
                <img src={selected.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">
                  {label === 'Padre' ? '♂' : '♀'}
                </div>
              )}
            </div>
            <span className="text-white flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-white/30 flex-1">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-white/30 hover:text-white/60">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute z-[60] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-52 flex flex-col">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar perro..."
                className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-white/30 p-3 text-center">Sin resultados</p>
            ) : filtered.map(dog => (
              <button key={dog.id} type="button"
                onClick={() => { onChange(dog.id); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition ${dog.id === value ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/70 hover:bg-white/5'}`}>
                <div className="w-7 h-7 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
                  {dog.thumbnail_url ? (
                    <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">
                      {dog.sex === 'male' ? '♂' : '♀'}
                    </div>
                  )}
                </div>
                <span className="truncate">{dog.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
