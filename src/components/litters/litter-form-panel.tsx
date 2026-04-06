'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ChevronDown, Lock } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface LitterFormPanelProps {
  open: boolean
  onClose: () => void
  editLitterId?: string | null
  userId: string
}

export default function LitterFormPanel({ open, onClose, editLitterId, userId }: LitterFormPanelProps) {
  const router = useRouter()
  const isEdit = !!editLitterId
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState('')

  const [breeds, setBreeds] = useState<any[]>([])
  const [maleDogs, setMaleDogs] = useState<any[]>([])
  const [femaleDogs, setFemaleDogs] = useState<any[]>([])

  const [form, setForm] = useState({
    father_id: '', mother_id: '', breed_id: '', birth_date: '',
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
        const { data: litter } = await supabase.from('litters').select('*').eq('id', editLitterId).single()
        if (litter) {
          setForm({
            father_id: litter.father_id || '', mother_id: litter.mother_id || '',
            breed_id: litter.breed_id || '', birth_date: litter.birth_date || '',
            puppy_count: litter.puppy_count?.toString() || '', status: litter.status || 'pending',
            is_public: litter.is_public ?? true,
          })
        }
      } else {
        setForm({ father_id: '', mother_id: '', breed_id: '', birth_date: '', puppy_count: '', status: 'planned', is_public: true })
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

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const payload = {
      father_id: form.father_id || null, mother_id: form.mother_id || null,
      breed_id: form.breed_id || null, birth_date: form.birth_date || null,
      puppy_count: form.puppy_count ? parseInt(form.puppy_count) : null,
      status: form.status, is_public: form.is_public,
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

      <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">{isEdit ? 'Editar camada' : 'Nueva camada'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        {dataLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

            {/* Breed */}
            <div>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Raza</h3>
              <AutocompleteSelect
                label="Raza"
                options={breeds.map(b => ({ value: b.id, label: b.name }))}
                value={form.breed_id}
                onChange={v => set('breed_id', v)}
                placeholder="Buscar raza..."
              />
            </div>

            {/* Parents — locked in edit mode */}
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
                  <DogSelect label="Padre" dogs={form.breed_id ? maleDogs.filter(d => d.breed_id === form.breed_id) : maleDogs} value={form.father_id} onChange={v => set('father_id', v)} sex="male" />
                  <DogSelect label="Madre" dogs={form.breed_id ? femaleDogs.filter(d => d.breed_id === form.breed_id) : femaleDogs} value={form.mother_id} onChange={v => set('mother_id', v)} sex="female" />
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Detalles</h3>
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

            {/* Status */}
            <div>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Estado</h3>
              <div className="flex gap-2">
                {[
                  { value: 'planned', label: 'Planificada', color: '#3498db' },
                  { value: 'mated', label: 'Cubricion', color: '#f39c12' },
                  { value: 'born', label: 'Parto', color: '#27ae60' },
                ].map(s => (
                  <button key={s.value} type="button" onClick={() => set('status', s.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                      form.status === s.value ? '' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                    style={form.status === s.value ? { borderColor: s.color, backgroundColor: s.color + '15', color: s.color } : undefined}>
                    {s.label}
                  </button>
                ))}
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
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
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

/* --- Locked field (read-only parent display in edit mode) --- */
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

/* --- Dog selector with photo --- */
function DogSelect({ label, dogs, value, onChange, sex }: {
  label: string; dogs: any[]; value: string; onChange: (v: string) => void; sex: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = dogs.find(d => d.id === value)
  const filtered = dogs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
  const sexColor = sex === 'male' ? BRAND.male : BRAND.female

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
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 cursor-pointer hover:border-white/20 transition">
        {selected ? (
          <>
            <div className="w-6 h-6 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
              {selected.thumbnail_url ? <img src={selected.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">{sex === 'male' ? '♂' : '♀'}</div>}
            </div>
            <span className="text-white flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-white/30 flex-1">Buscar {label.toLowerCase()}...</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></span>}
          <ChevronDown className={`w-4 h-4 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="absolute z-[60] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-52 flex flex-col">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? <p className="text-sm text-white/30 p-3 text-center">Sin resultados</p> : filtered.map(dog => (
              <button key={dog.id} type="button" onClick={() => { onChange(dog.id); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition ${dog.id === value ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/70 hover:bg-white/5'}`}>
                <div className="w-7 h-7 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
                  {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">{sex === 'male' ? '♂' : '♀'}</div>}
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

function AutocompleteSelect({ label, options, value, onChange, placeholder }: {
  label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; placeholder?: string
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
      <div onClick={() => { setOpen(!open); setSearch('') }}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer hover:border-white/20 transition">
        <span className={selected ? 'text-white' : 'text-white/30'}>{selected?.label || placeholder}</span>
        <div className="flex items-center gap-1">
          {value && <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></span>}
          <ChevronDown className={`w-4 h-4 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="absolute z-[60] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-52 flex flex-col">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? <p className="text-sm text-white/30 p-3 text-center">Sin resultados</p> : filtered.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
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
