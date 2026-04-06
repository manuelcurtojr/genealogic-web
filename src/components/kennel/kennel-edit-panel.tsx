'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Globe, ExternalLink, MessageCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  kennel: any
}

export default function KennelEditPanel({ open, onClose, kennel }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', description: '', foundation_date: '', website: '',
    social_instagram: '', social_facebook: '', social_tiktok: '', social_youtube: '',
    whatsapp_phone: '', whatsapp_text: '', whatsapp_enabled: false,
  })

  useEffect(() => {
    if (!open || !kennel) return
    setError('')
    setForm({
      name: kennel.name || '',
      description: kennel.description || '',
      foundation_date: kennel.foundation_date || '',
      website: kennel.website || '',
      social_instagram: kennel.social_instagram || '',
      social_facebook: kennel.social_facebook || '',
      social_tiktok: kennel.social_tiktok || '',
      social_youtube: kennel.social_youtube || '',
      whatsapp_phone: kennel.whatsapp_phone || '',
      whatsapp_text: kennel.whatsapp_text || '',
      whatsapp_enabled: kennel.whatsapp_enabled || false,
    })
  }, [open, kennel])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.from('kennels').update({
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
    }).eq('id', kennel.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    onClose()
    router.refresh()
  }

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-xl z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">Editar criadero</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Basic info */}
          <Sec title="Informacion basica">
            <Field label="Nombre del criadero *" value={form.name} onChange={v => set('name', v)} />
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Descripcion</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none"
                placeholder="Describe tu criadero, tu filosofia de cria..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de fundacion" value={form.foundation_date} onChange={v => set('foundation_date', v)} type="date" />
              <Field label="Sitio web" value={form.website} onChange={v => set('website', v)} placeholder="https://..." />
            </div>
          </Sec>

          {/* Social */}
          <Sec title="Redes sociales">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Instagram" value={form.social_instagram} onChange={v => set('social_instagram', v)} placeholder="https://instagram.com/..." />
              <Field label="Facebook" value={form.social_facebook} onChange={v => set('social_facebook', v)} placeholder="https://facebook.com/..." />
              <Field label="TikTok" value={form.social_tiktok} onChange={v => set('social_tiktok', v)} placeholder="https://tiktok.com/@..." />
              <Field label="YouTube" value={form.social_youtube} onChange={v => set('social_youtube', v)} placeholder="https://youtube.com/..." />
            </div>
          </Sec>

          {/* WhatsApp */}
          <Sec title="WhatsApp">
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium">Activar WhatsApp</p>
                  <p className="text-[11px] text-white/30">Boton de WhatsApp en tu perfil publico</p>
                </div>
              </div>
              <button type="button" onClick={() => set('whatsapp_enabled', !form.whatsapp_enabled)}
                className={`w-10 h-5 rounded-full transition relative ${form.whatsapp_enabled ? 'bg-green-500' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${form.whatsapp_enabled ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            {form.whatsapp_enabled && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Numero" value={form.whatsapp_phone} onChange={v => set('whatsapp_phone', v)} placeholder="+34 600 000 000" />
                <Field label="Mensaje predeterminado" value={form.whatsapp_text} onChange={v => set('whatsapp_text', v)} placeholder="Hola, me interesa..." />
              </div>
            )}
          </Sec>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
      <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}
