'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Dog, X, Loader2, Store, Globe, Calendar, Crown, ArrowRight } from 'lucide-react'
import { roleAtLeast } from '@/lib/permissions'
import Link from 'next/link'

interface Props {
  userId: string
}

export default function KennelEmpty({ userId }: Props) {
  const router = useRouter()
  const [showPanel, setShowPanel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('role').eq('id', userId).single()
      .then(({ data }) => setUserRole(data?.role || 'free'))
  }, [userId])

  const [form, setForm] = useState({
    name: '',
    description: '',
    foundation_date: '',
    website: '',
  })

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  async function handleCreate() {
    if (!form.name.trim()) return
    setSaving(true)
    setError('')

    const supabase = createClient()

    // Check if kennel already exists (prevent duplicates)
    const { data: existing } = await supabase.from('kennels').select('id').eq('owner_id', userId).limit(1)
    if (existing && existing.length > 0) {
      // Already has a kennel, just refresh
      router.refresh()
      return
    }

    const { error: err } = await supabase.from('kennels').insert({
      owner_id: userId,
      name: form.name.trim(),
      description: form.description || null,
      foundation_date: form.foundation_date || null,
      website: form.website || null,
    })

    if (err) { setError(err.message); setSaving(false); return }
    router.refresh()
  }

  return (
    <>
      <div className="text-center py-20">
        <Store className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">No tienes un criadero</h1>
        {userRole && !roleAtLeast(userRole, 'amateur') ? (
          <>
            <p className="text-white/40 mb-6">Mejora a Amateur para crear tu criadero, gestionar camadas y recibir solicitudes.</p>
            <Link href="/pricing" className="inline-flex items-center gap-2 bg-[#D74709] hover:bg-[#c03d07] text-white px-6 py-3 rounded-lg font-semibold transition">
              <Crown className="w-4 h-4" /> Ver planes <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            <p className="text-white/40 mb-6">Crea tu criadero para gestionar tus perros y tu perfil publico</p>
            <button
              onClick={() => setShowPanel(true)}
              className="bg-[#D74709] hover:bg-[#c03d07] text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Crear criadero
            </button>
          </>
        )}
      </div>

      {/* Slide panel */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${showPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowPanel(false)}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-xl z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${showPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">Crear criadero</h2>
          <button onClick={() => setShowPanel(false)} className="text-white/40 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Nombre del criadero *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ej: Irema Curto"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Descripcion</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Describe tu criadero, tu filosofia de cria..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Fecha de fundacion</label>
              <input
                type="date"
                value={form.foundation_date}
                onChange={e => set('foundation_date', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Sitio web</label>
              <input
                type="url"
                value={form.website}
                onChange={e => set('website', e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
              />
            </div>
          </div>

          <p className="text-[11px] text-white/25">Podras completar redes sociales, WhatsApp y mas detalles despues en la página de edicion.</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={() => setShowPanel(false)} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.name.trim()}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Creando...' : 'Crear criadero'}
          </button>
        </div>
      </div>
    </>
  )
}
