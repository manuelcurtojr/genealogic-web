'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewDogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', sex: 'male', birth_date: '', registration: '', microchip: '', weight: '', height: '',
  })

  const set = (field: string, value: string) => setForm({ ...form, [field]: value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado'); setLoading(false); return }

    const { data, error: err } = await supabase.from('dogs').insert({
      owner_id: user.id,
      name: form.name,
      sex: form.sex,
      birth_date: form.birth_date || null,
      registration: form.registration || null,
      microchip: form.microchip || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
    }).select('id').single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dogs/${data.id}`)
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dogs" className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Anadir perro</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

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
        <Field label="Numero de registro" value={form.registration} onChange={(v) => set('registration', v)} placeholder="UKC, FCI, etc." />
        <Field label="Microchip" value={form.microchip} onChange={(v) => set('microchip', v)} />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Peso (kg)" value={form.weight} onChange={(v) => set('weight', v)} type="number" />
          <Field label="Altura (cm)" value={form.height} onChange={(v) => set('height', v)} type="number" />
        </div>

        <button type="submit" disabled={loading || !form.name}
          className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Creando...' : 'Crear perro'}
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
