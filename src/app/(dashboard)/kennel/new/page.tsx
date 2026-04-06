'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewKennelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado'); setLoading(false); return }

    const { error: err } = await supabase.from('kennels').insert({ owner_id: user.id, name: name.trim() })
    if (err) { setError(err.message); setLoading(false); return }

    router.push('/kennel')
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/kennel" className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Crear criadero</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

        <div>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Nombre del criadero *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus
            placeholder="Ej: Irema Curtó"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
        </div>

        <button type="submit" disabled={loading || !name.trim()}
          className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Creando...' : 'Crear criadero'}
        </button>

        <p className="text-xs text-white/30 text-center">Podras completar los detalles despues en la pagina de edicion.</p>
      </form>
    </div>
  )
}
