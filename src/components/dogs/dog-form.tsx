'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import SearchableSelect from '@/components/ui/searchable-select'

interface DogFormProps {
  initialData?: any
  breeds: { id: string; name: string }[]
  colors: { id: string; name: string }[]
  kennels: { id: string; name: string }[]
  maleDogs: { id: string; name: string }[]
  femaleDogs: { id: string; name: string }[]
  userId: string
}

export default function DogForm({ initialData, breeds, colors, kennels, maleDogs, femaleDogs, userId }: DogFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: initialData?.name || '',
    sex: initialData?.sex || 'male',
    birth_date: initialData?.birth_date || '',
    registration: initialData?.registration || '',
    microchip: initialData?.microchip || '',
    weight: initialData?.weight?.toString() || '',
    height: initialData?.height?.toString() || '',
    breed_id: initialData?.breed_id || '',
    color_id: initialData?.color_id || '',
    kennel_id: initialData?.kennel_id || '',
    father_id: initialData?.father_id || '',
    mother_id: initialData?.mother_id || '',
    is_public: initialData?.is_public ?? true,
  })

  const set = (field: string, value: any) => setForm({ ...form, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      sex: form.sex,
      birth_date: form.birth_date || null,
      registration: form.registration || null,
      microchip: form.microchip || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      breed_id: form.breed_id || null,
      color_id: form.color_id || null,
      kennel_id: form.kennel_id || null,
      father_id: form.father_id || null,
      mother_id: form.mother_id || null,
      is_public: form.is_public,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('dogs').update(payload).eq('id', initialData.id)
      if (err) { setError(err.message); setLoading(false); return }
      router.push(`/dogs/${initialData.id}`)
      router.refresh()
    } else {
      const { data, error: err } = await supabase.from('dogs').insert({ ...payload, owner_id: userId }).select('id').single()
      if (err) { setError(err.message); setLoading(false); return }
      router.push(`/dogs/${data.id}`)
    }
  }

  const breedOptions = breeds.map((b) => ({ value: b.id, label: b.name }))
  const colorOptions = colors.map((c) => ({ value: c.id, label: c.name }))
  const kennelOptions = kennels.map((k) => ({ value: k.id, label: k.name }))
  const fatherOptions = maleDogs.filter((d) => d.id !== initialData?.id).map((d) => ({ value: d.id, label: d.name }))
  const motherOptions = femaleDogs.filter((d) => d.id !== initialData?.id).map((d) => ({ value: d.id, label: d.name }))

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href={isEdit ? `/dogs/${initialData.id}` : '/dogs'} className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{isEdit ? 'Editar perro' : 'Añadir perro'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

        {/* Basic */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Datos basicos</h2>
          <div className="space-y-4">
            <Field label="Nombre *" value={form.name} onChange={(v) => set('name', v)} required />
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Sexo *</label>
              <div className="flex gap-3">
                {(['male', 'female'] as const).map((s) => (
                  <button key={s} type="button" onClick={() => set('sex', s)}
                    className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition ${
                      form.sex === s
                        ? s === 'male' ? 'border-blue-400 bg-blue-400/10 text-blue-400' : 'border-pink-400 bg-pink-400/10 text-pink-400'
                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                    }`}>
                    {s === 'male' ? '♂ Macho' : '♀ Hembra'}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Fecha de nacimiento" value={form.birth_date} onChange={(v) => set('birth_date', v)} type="date" />
          </div>
        </section>

        {/* Classification */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Clasificacion</h2>
          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect label="Raza" options={breedOptions} value={form.breed_id} onChange={(v) => set('breed_id', v)} placeholder="Seleccionar raza" />
            <SearchableSelect label="Color" options={colorOptions} value={form.color_id} onChange={(v) => set('color_id', v)} placeholder="Seleccionar color" />
          </div>
          <div className="mt-4">
            <SearchableSelect label="Criadero" options={kennelOptions} value={form.kennel_id} onChange={(v) => set('kennel_id', v)} placeholder="Seleccionar criadero" />
          </div>
        </section>

        {/* Identification */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Identificacion</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registro" value={form.registration} onChange={(v) => set('registration', v)} placeholder="UKC, FCI, etc." />
            <Field label="Microchip" value={form.microchip} onChange={(v) => set('microchip', v)} />
          </div>
        </section>

        {/* Measurements */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Medidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Peso (kg)" value={form.weight} onChange={(v) => set('weight', v)} type="number" />
            <Field label="Altura (cm)" value={form.height} onChange={(v) => set('height', v)} type="number" />
          </div>
        </section>

        {/* Parents */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Padres</h2>
          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect label="Padre" options={fatherOptions} value={form.father_id} onChange={(v) => set('father_id', v)} placeholder="Seleccionar padre" />
            <SearchableSelect label="Madre" options={motherOptions} value={form.mother_id} onChange={(v) => set('mother_id', v)} placeholder="Seleccionar madre" />
          </div>
        </section>

        {/* Visibility */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
          <div>
            <p className="text-sm font-medium">Perfil publico</p>
            <p className="text-xs text-white/40 mt-0.5">Otros usuarios podran ver este perro</p>
          </div>
          <button
            type="button"
            onClick={() => set('is_public', !form.is_public)}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.is_public ? 'bg-[#D74709]' : 'bg-white/20'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${form.is_public ? 'translate-x-5.5 left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        <button type="submit" disabled={loading || !form.name.trim()}
          className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? 'Guardando...' : 'Creando...') : (isEdit ? 'Guardar cambios' : 'Crear perro')}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}
