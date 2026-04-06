'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import SearchableSelect from '@/components/ui/searchable-select'

interface LitterFormProps {
  initialData?: any
  breeds: { id: string; name: string }[]
  maleDogs: { id: string; name: string }[]
  femaleDogs: { id: string; name: string }[]
  userId: string
}

export default function LitterForm({ initialData, breeds, maleDogs, femaleDogs, userId }: LitterFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    father_id: initialData?.father_id || '',
    mother_id: initialData?.mother_id || '',
    breed_id: initialData?.breed_id || '',
    birth_date: initialData?.birth_date || '',
    puppy_count: initialData?.puppy_count?.toString() || '',
    status: initialData?.status || 'pending',
    is_public: initialData?.is_public ?? true,
  })

  const set = (field: string, value: any) => setForm({ ...form, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      father_id: form.father_id || null,
      mother_id: form.mother_id || null,
      breed_id: form.breed_id || null,
      birth_date: form.birth_date || null,
      puppy_count: form.puppy_count ? parseInt(form.puppy_count) : null,
      status: form.status,
      is_public: form.is_public,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('litters').update(payload).eq('id', initialData.id)
      if (err) { setError(err.message); setLoading(false); return }
      router.push(`/litters/${initialData.id}`)
      router.refresh()
    } else {
      const { data, error: err } = await supabase.from('litters').insert({ ...payload, owner_id: userId }).select('id').single()
      if (err) { setError(err.message); setLoading(false); return }
      router.push(`/litters/${data.id}`)
    }
  }

  const breedOptions = breeds.map((b) => ({ value: b.id, label: b.name }))
  const fatherOptions = maleDogs.map((d) => ({ value: d.id, label: d.name }))
  const motherOptions = femaleDogs.map((d) => ({ value: d.id, label: d.name }))

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href={isEdit ? `/litters/${initialData.id}` : '/litters'} className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{isEdit ? 'Editar camada' : 'Nueva camada'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

        {/* Parents */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Padres</h2>
          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect label="Padre ♂" options={fatherOptions} value={form.father_id} onChange={(v) => set('father_id', v)} placeholder="Seleccionar padre" />
            <SearchableSelect label="Madre ♀" options={motherOptions} value={form.mother_id} onChange={(v) => set('mother_id', v)} placeholder="Seleccionar madre" />
          </div>
        </section>

        {/* Details */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Detalles</h2>
          <div className="space-y-4">
            <SearchableSelect label="Raza" options={breedOptions} value={form.breed_id} onChange={(v) => set('breed_id', v)} placeholder="Seleccionar raza" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Fecha de nacimiento</label>
                <input type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#D74709] focus:outline-none transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Numero de cachorros</label>
                <input type="number" min="0" value={form.puppy_count} onChange={(e) => set('puppy_count', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#D74709] focus:outline-none transition" />
              </div>
            </div>
          </div>
        </section>

        {/* Status */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Estado</h2>
          <div className="flex gap-3">
            {[
              { value: 'pending', label: 'Pendiente', color: '#f39c12' },
              { value: 'confirmed', label: 'Confirmada', color: '#27ae60' },
            ].map((s) => (
              <button key={s.value} type="button" onClick={() => set('status', s.value)}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition ${
                  form.status === s.value
                    ? 'text-white' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                }`}
                style={form.status === s.value ? { borderColor: s.color, backgroundColor: s.color + '15', color: s.color } : undefined}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* Visibility */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
          <div>
            <p className="text-sm font-medium">Camada publica</p>
            <p className="text-xs text-white/40 mt-0.5">Visible para otros usuarios</p>
          </div>
          <button
            type="button"
            onClick={() => set('is_public', !form.is_public)}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.is_public ? 'bg-[#D74709]' : 'bg-white/20'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${form.is_public ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? (isEdit ? 'Guardando...' : 'Creando...') : (isEdit ? 'Guardar cambios' : 'Crear camada')}
        </button>
      </form>
    </div>
  )
}
