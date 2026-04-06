'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'

interface DogFormPanelProps {
  open: boolean
  onClose: () => void
  breeds: { id: string; name: string }[]
  colors: { id: string; name: string }[]
  kennels: { id: string; name: string }[]
  maleDogs: { id: string; name: string }[]
  femaleDogs: { id: string; name: string }[]
  userId: string
}

export default function DogFormPanel({ open, onClose, breeds, colors, kennels, maleDogs, femaleDogs, userId }: DogFormPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', sex: 'male', birth_date: '', registration: '', microchip: '',
    weight: '', height: '', breed_id: '', color_id: '', kennel_id: '',
    father_id: '', mother_id: '', is_public: true,
  })

  // Reset form when panel opens
  useEffect(() => {
    if (open) {
      setForm({ name: '', sex: 'male', birth_date: '', registration: '', microchip: '', weight: '', height: '', breed_id: '', color_id: '', kennel_id: '', father_id: '', mother_id: '', is_public: true })
      setError('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      owner_id: userId,
    }

    const { data, error: err } = await supabase.from('dogs').insert(payload).select('id').single()
    setLoading(false)
    if (err) { setError(err.message); return }
    onClose()
    router.push(`/dogs/${data.id}`)
  }

  const breedOptions = breeds.map(b => ({ value: b.id, label: b.name }))
  const colorOptions = colors.map(c => ({ value: c.id, label: c.name }))
  const kennelOptions = kennels.map(k => ({ value: k.id, label: k.name }))
  const fatherOptions = maleDogs.map(d => ({ value: d.id, label: d.name }))
  const motherOptions = femaleDogs.map(d => ({ value: d.id, label: d.name }))

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Fixed header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">Anadir perro</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">{error}</div>}

          {/* Basic */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Datos basicos</h3>
            <div className="space-y-3">
              <Field label="Nombre *" value={form.name} onChange={v => set('name', v)} required />
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
            </div>
          </section>

          {/* Classification */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Clasificacion</h3>
            <div className="grid grid-cols-2 gap-3">
              <SearchableSelect label="Raza" options={breedOptions} value={form.breed_id} onChange={v => set('breed_id', v)} placeholder="Seleccionar" />
              <SearchableSelect label="Color" options={colorOptions} value={form.color_id} onChange={v => set('color_id', v)} placeholder="Seleccionar" />
            </div>
            <div className="mt-3">
              <SearchableSelect label="Criadero" options={kennelOptions} value={form.kennel_id} onChange={v => set('kennel_id', v)} placeholder="Seleccionar criadero" />
            </div>
          </section>

          {/* Identification */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Identificacion</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Registro" value={form.registration} onChange={v => set('registration', v)} placeholder="UKC, FCI..." />
              <Field label="Microchip" value={form.microchip} onChange={v => set('microchip', v)} />
            </div>
          </section>

          {/* Measurements */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Medidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso (kg)" value={form.weight} onChange={v => set('weight', v)} type="number" />
              <Field label="Altura (cm)" value={form.height} onChange={v => set('height', v)} type="number" />
            </div>
          </section>

          {/* Parents */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Padres</h3>
            <div className="grid grid-cols-2 gap-3">
              <SearchableSelect label="Padre" options={fatherOptions} value={form.father_id} onChange={v => set('father_id', v)} placeholder="Seleccionar" />
              <SearchableSelect label="Madre" options={motherOptions} value={form.mother_id} onChange={v => set('mother_id', v)} placeholder="Seleccionar" />
            </div>
          </section>

          {/* Visibility */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3 mb-6">
            <div>
              <p className="text-sm font-medium">Perfil publico</p>
              <p className="text-xs text-white/40">Otros usuarios podran ver este perro</p>
            </div>
            <button type="button" onClick={() => set('is_public', !form.is_public)}
              className={`w-10 h-5 rounded-full transition relative ${form.is_public ? 'bg-[#D74709]' : 'bg-white/20'}`}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition ${form.is_public ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        </form>

        {/* Fixed footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading || !form.name.trim()}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Creando...' : 'Crear perro'}
          </button>
        </div>
      </div>
    </>
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
