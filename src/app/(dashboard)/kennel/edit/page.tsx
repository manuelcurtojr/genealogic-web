'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Globe, ExternalLink } from 'lucide-react'

export default function EditKennelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [kennelId, setKennelId] = useState('')

  const [form, setForm] = useState({
    name: '', description: '', foundation_date: '', website: '',
    social_instagram: '', social_facebook: '', social_tiktok: '', social_youtube: '',
    whatsapp_phone: '', whatsapp_text: '', whatsapp_enabled: false,
  })

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: arr } = await supabase.from('kennels').select('*').eq('owner_id', user.id).limit(1)
      const data = arr?.[0] || null
      if (data) {
        setKennelId(data.id)
        setForm({
          name: data.name || '',
          description: data.description || '',
          foundation_date: data.foundation_date || '',
          website: data.website || '',
          social_instagram: data.social_instagram || '',
          social_facebook: data.social_facebook || '',
          social_tiktok: data.social_tiktok || '',
          social_youtube: data.social_youtube || '',
          whatsapp_phone: data.whatsapp_phone || '',
          whatsapp_text: data.whatsapp_text || '',
          whatsapp_enabled: data.whatsapp_enabled || false,
        })
      }
      setFetching(false)
    }
    fetch()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      foundation_date: form.foundation_date || null,
      website: form.website || null,
      social_instagram: form.social_instagram || null,
      social_facebook: form.social_facebook || null,
      social_tiktok: form.social_tiktok || null,
      social_youtube: form.social_youtube || null,
      whatsapp_phone: form.whatsapp_phone || null,
      whatsapp_text: form.whatsapp_text || null,
      whatsapp_enabled: form.whatsapp_enabled,
    }

    const { error: err } = await supabase.from('kennels').update(payload).eq('id', kennelId)
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/kennel')
    router.refresh()
  }

  if (fetching) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/kennel" className="text-white/40 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Editar criadero</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

        {/* Basic */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Información basica</h2>
          <div className="space-y-4">
            <Field label="Nombre del criadero *" value={form.name} onChange={(v) => set('name', v)} required />
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Descripcion</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none"
                placeholder="Describe tu criadero..." />
            </div>
            <Field label="Fecha de fundacion" value={form.foundation_date} onChange={(v) => set('foundation_date', v)} type="date" />
            <Field label="Sitio web" value={form.website} onChange={(v) => set('website', v)} placeholder="https://..." icon={Globe} />
          </div>
        </section>

        {/* Social */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Redes sociales</h2>
          <div className="space-y-4">
            <Field label="Instagram" value={form.social_instagram} onChange={(v) => set('social_instagram', v)} placeholder="https://instagram.com/..." icon={ExternalLink} />
            <Field label="Facebook" value={form.social_facebook} onChange={(v) => set('social_facebook', v)} placeholder="https://facebook.com/..." icon={ExternalLink} />
            <Field label="TikTok" value={form.social_tiktok} onChange={(v) => set('social_tiktok', v)} placeholder="https://tiktok.com/@..." />
            <Field label="YouTube" value={form.social_youtube} onChange={(v) => set('social_youtube', v)} placeholder="https://youtube.com/..." />
          </div>
        </section>

        {/* WhatsApp */}
        <section>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">WhatsApp</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium">Activar WhatsApp</p>
                <p className="text-xs text-white/40 mt-0.5">Mostrar boton de WhatsApp en tu perfil</p>
              </div>
              <ToggleSwitch value={form.whatsapp_enabled} onChange={(v) => set('whatsapp_enabled', v)} color="bg-green-500" />
            </div>
            {form.whatsapp_enabled && (
              <>
                <Field label="Número de WhatsApp" value={form.whatsapp_phone} onChange={(v) => set('whatsapp_phone', v)} placeholder="+34 600 000 000" />
                <Field label="Mensaje predeterminado" value={form.whatsapp_text} onChange={(v) => set('whatsapp_text', v)} placeholder="Hola, me interesa..." />
              </>
            )}
          </div>
        </section>

        <button type="submit" disabled={loading || !form.name.trim()}
          className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, required, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; icon?: React.ElementType
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
          className={`w-full bg-white/5 border border-white/10 rounded-lg py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition ${Icon ? 'pl-10 pr-4' : 'px-4'}`} />
      </div>
    </div>
  )
}
