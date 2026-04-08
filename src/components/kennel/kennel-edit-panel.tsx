'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Globe, ExternalLink, MessageCircle } from 'lucide-react'
import { AFFIX_FORMATS, getAffixPreview, type AffixFormat } from '@/lib/affix'

interface Props {
  open: boolean
  onClose: () => void
  kennel: any
}

export default function KennelEditPanel({ open, onClose, kennel }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [allBreeds, setAllBreeds] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    name: '', description: '', foundation_date: '', website: '',
    social_instagram: '', social_facebook: '', social_tiktok: '', social_youtube: '',
    whatsapp_phone: '', whatsapp_text: '', whatsapp_enabled: false,
    affix_format: 'suffix_de' as AffixFormat,
    breed_ids: [] as string[],
  })

  useEffect(() => {
    if (!open || !kennel) return
    setError('')
    // Fetch breeds
    const supabase = createClient()
    supabase.from('breeds').select('id, name').order('name').then(({ data }) => setAllBreeds(data || []))
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
      affix_format: kennel.affix_format || 'suffix_de',
      breed_ids: kennel.breed_ids || [],
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
      affix_format: form.affix_format,
      breed_ids: form.breed_ids,
    }).eq('id', kennel.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    onClose()
    router.refresh()
  }

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-xl z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">Editar criadero</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Basic info */}
          <Sec title="Información basica">
            <Field label="Nombre del criadero *" value={form.name} onChange={v => set('name', v)} />
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Descripcion</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none"
                placeholder="Describe tu criadero, tu filosofia de cria..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Fecha de fundacion" value={form.foundation_date} onChange={v => set('foundation_date', v)} type="date" />
              <Field label="Sitio web" value={form.website} onChange={v => set('website', v)} placeholder="https://..." />
            </div>
          </Sec>

          {/* Affix format */}
          <Sec title="Formato del nombre (afijo)">
            <p className="text-[11px] text-white/30 -mt-1 mb-2">Define como se formara el nombre de los cachorros de tu criadero</p>
            <div className="space-y-1.5">
              {AFFIX_FORMATS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => set('affix_format', f.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition flex items-center justify-between ${
                    form.affix_format === f.value
                      ? 'border-[#D74709] bg-[#D74709]/5'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs text-white/50">{f.label}</span>
                  <span className={`text-xs font-semibold ${form.affix_format === f.value ? 'text-[#D74709]' : 'text-white/30'}`}>
                    {getAffixPreview(f.value, form.name)}
                  </span>
                </button>
              ))}
            </div>
          </Sec>

          {/* Breeds */}
          <Sec title="Razas que crias">
            <p className="text-[11px] text-white/30 -mt-1 mb-2">Selecciona las razas que apareceran en tu formulario de contacto</p>
            <div className="flex flex-wrap gap-1.5">
              {allBreeds.map(b => {
                const selected = form.breed_ids.includes(b.id)
                return (
                  <button key={b.id} type="button"
                    onClick={() => set('breed_ids', selected ? form.breed_ids.filter((id: string) => id !== b.id) : [...form.breed_ids, b.id])}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${selected ? 'border-[#D74709] bg-[#D74709]/10 text-[#D74709]' : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20'}`}>
                    {b.name}
                  </button>
                )
              })}
            </div>
          </Sec>

          {/* Social */}
          <Sec title="Redes sociales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Número" value={form.whatsapp_phone} onChange={v => set('whatsapp_phone', v)} placeholder="+34 600 000 000" />
                <Field label="Mensaje predeterminado" value={form.whatsapp_text} onChange={v => set('whatsapp_text', v)} placeholder="Hola, me interesa..." />
              </div>
            )}
          </Sec>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex-shrink-0">
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
