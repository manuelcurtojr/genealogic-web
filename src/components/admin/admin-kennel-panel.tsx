'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Check, Store, Globe, MessageCircle, Trash2, ExternalLink, Dog, Users, Eye } from 'lucide-react'
import { AFFIX_FORMATS } from '@/lib/affix'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  kennelId: string | null
}

export default function AdminKennelPanel({ open, onClose, onSaved, kennelId }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activity, setActivity] = useState({ dogs: 0, litters: 0 })
  const [ownerInfo, setOwnerInfo] = useState<any>(null)
  const [breeds, setBreeds] = useState<any[]>([])

  const [form, setForm] = useState({
    name: '', description: '', website: '', foundation_date: '', logo_url: '',
    affix_format: 'suffix_de', breed_ids: [] as string[],
    social_facebook: '', social_instagram: '', social_tiktok: '', social_youtube: '',
    whatsapp_enabled: false, whatsapp_phone: '', whatsapp_text: '',
    owner_id: '',
  })

  useEffect(() => {
    if (!open || !kennelId) return
    setLoading(true)
    setError('')
    setShowDeleteConfirm(false)

    const supabase = createClient()
    async function load() {
      const [kennelRes, breedsRes] = await Promise.all([
        supabase.from('kennels').select('*').eq('id', kennelId).single(),
        supabase.from('breeds').select('id, name').order('name'),
      ])

      const k = kennelRes.data
      setBreeds(breedsRes.data || [])

      if (!k) { setLoading(false); return }

      setForm({
        name: k.name || '', description: k.description || '', website: k.website || '',
        foundation_date: k.foundation_date || '', logo_url: k.logo_url || '',
        affix_format: k.affix_format || 'suffix_de', breed_ids: k.breed_ids || [],
        social_facebook: k.social_facebook || '', social_instagram: k.social_instagram || '',
        social_tiktok: k.social_tiktok || '', social_youtube: k.social_youtube || '',
        whatsapp_enabled: k.whatsapp_enabled || false, whatsapp_phone: k.whatsapp_phone || '',
        whatsapp_text: k.whatsapp_text || '', owner_id: k.owner_id || '',
      })

      // Load owner info
      if (k.owner_id) {
        const { data: owner } = await supabase.from('profiles').select('display_name, email').eq('id', k.owner_id).single()
        setOwnerInfo(owner)
      }

      // Load activity stats
      const [dogsRes, littersRes] = await Promise.all([
        supabase.from('dogs').select('id', { count: 'exact', head: true }).eq('kennel_id', kennelId),
        supabase.from('litters').select('id', { count: 'exact', head: true }).eq('owner_id', k.owner_id),
      ])
      setActivity({
        dogs: dogsRes.count || 0, litters: littersRes.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [open, kennelId])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  const set = (f: string, v: any) => setForm(prev => ({ ...prev, [f]: v }))

  const toggleBreed = (breedId: string) => {
    setForm(prev => ({
      ...prev,
      breed_ids: prev.breed_ids.includes(breedId)
        ? prev.breed_ids.filter(id => id !== breedId)
        : [...prev.breed_ids, breedId],
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('kennels').update({
      name: form.name.trim(), description: form.description.trim() || null,
      website: form.website.trim() || null, foundation_date: form.foundation_date || null,
      logo_url: form.logo_url.trim() || null, affix_format: form.affix_format,
      breed_ids: form.breed_ids,
      social_facebook: form.social_facebook.trim() || null, social_instagram: form.social_instagram.trim() || null,
      social_tiktok: form.social_tiktok.trim() || null, social_youtube: form.social_youtube.trim() || null,
      whatsapp_enabled: form.whatsapp_enabled, whatsapp_phone: form.whatsapp_phone.trim() || null,
      whatsapp_text: form.whatsapp_text.trim() || null,
    }).eq('id', kennelId)
    if (err) { setError(err.message); setSaving(false); return }

    setSaving(false)
    onSaved()
    onClose()
  }

  const deleteKennel = async () => {
    if (!kennelId) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'kennels', id: kennelId }),
      })
      const data = await res.json()
      if (data.success) { onSaved(); onClose() }
      else alert(data.error || 'Error al eliminar')
    } catch { alert('Error de red') }
    setDeleting(false)
  }

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-xl z-[70] bg-ink-800 border-l border-hair shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-3 border-b border-hair flex-shrink-0">
          <h2 className="text-lg font-semibold">Editar criadero</h2>
          <button onClick={onClose} className="text-fg-mute hover:text-fg transition"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-fg-mute" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

            {/* Activity */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Perros', value: activity.dogs, icon: Dog },
                { label: 'Camadas', value: activity.litters, icon: Users },
              ].map(s => (
                <div key={s.label} className="bg-chip rounded-lg p-2 text-center">
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-[9px] text-fg-mute">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Owner */}
            {ownerInfo && (
              <div className="bg-chip border border-hair rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xs font-bold flex-shrink-0">
                  {(ownerInfo.display_name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{ownerInfo.display_name}</p>
                  <p className="text-[10px] text-fg-mute truncate">{ownerInfo.email}</p>
                </div>
                <span className="text-[9px] text-fg-mute ml-auto">Propietario</span>
              </div>
            )}

            {/* Datos generales */}
            <Section title="Datos generales" icon={Store}>
              <div className="space-y-3">
                <Input label="Nombre *" value={form.name} onChange={v => set('name', v)} />
                <div>
                  <label className="text-[10px] font-semibold text-fg-mute uppercase tracking-wider mb-1 block">Descripción</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                    className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Sitio web" value={form.website} onChange={v => set('website', v)} placeholder="https://..." />
                  <Input label="Fecha fundación" value={form.foundation_date} onChange={v => set('foundation_date', v)} type="date" />
                </div>
                <Input label="URL del logo" value={form.logo_url} onChange={v => set('logo_url', v)} placeholder="https://..." />
                <div>
                  <label className="text-[10px] font-semibold text-fg-mute uppercase tracking-wider mb-1 block">Formato de afijo</label>
                  <select value={form.affix_format} onChange={e => set('affix_format', e.target.value)}
                    className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none appearance-none">
                    {AFFIX_FORMATS.map(f => <option key={f.value} value={f.value}>{f.example}</option>)}
                  </select>
                </div>
              </div>
            </Section>

            {/* Razas */}
            <Section title="Razas del criadero" icon={Dog}>
              <div className="flex flex-wrap gap-1.5">
                {breeds.map(b => {
                  const selected = form.breed_ids.includes(b.id)
                  return (
                    <button key={b.id} onClick={() => toggleBreed(b.id)}
                      className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition ${
                        selected ? 'bg-[#D74709]/15 text-[#D74709] border border-[#D74709]/30' : 'bg-chip text-fg-mute border border-hair hover:border-hair-strong'
                      }`}>
                      {b.name}
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* Redes sociales */}
            <Section title="Redes sociales" icon={Globe}>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Facebook" value={form.social_facebook} onChange={v => set('social_facebook', v)} placeholder="URL o usuario" />
                <Input label="Instagram" value={form.social_instagram} onChange={v => set('social_instagram', v)} placeholder="@usuario" />
                <Input label="TikTok" value={form.social_tiktok} onChange={v => set('social_tiktok', v)} placeholder="@usuario" />
                <Input label="YouTube" value={form.social_youtube} onChange={v => set('social_youtube', v)} placeholder="URL o canal" />
              </div>
            </Section>

            {/* WhatsApp */}
            <Section title="WhatsApp" icon={MessageCircle}>
              <label className="flex items-center gap-2 text-sm text-fg-dim cursor-pointer mb-3">
                <input type="checkbox" checked={form.whatsapp_enabled} onChange={e => set('whatsapp_enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-hair-strong bg-chip text-[#D74709] focus:ring-[#D74709] focus:ring-offset-0" />
                Activar botón de WhatsApp
              </label>
              {form.whatsapp_enabled && (
                <div className="space-y-3 pl-6 border-l-2 border-green-500/30">
                  <Input label="Número (con prefijo)" value={form.whatsapp_phone} onChange={v => set('whatsapp_phone', v)} placeholder="+34612345678" />
                  <div>
                    <label className="text-[10px] font-semibold text-fg-mute uppercase tracking-wider mb-1 block">Mensaje predeterminado</label>
                    <textarea value={form.whatsapp_text} onChange={e => set('whatsapp_text', e.target.value)} rows={2}
                      placeholder="Hola, me interesa información sobre..."
                      className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none resize-none" />
                  </div>
                </div>
              )}
            </Section>

            {/* Actions */}
            <Section title="Acciones" icon={Eye}>
              <div className="space-y-2">
                <a href={`/kennels/${kennelId}`} target="_blank"
                  className="w-full flex items-center justify-center gap-2 bg-chip border border-hair text-fg-dim px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-chip transition">
                  <ExternalLink className="w-4 h-4" /> Ver perfil público
                </a>
              </div>
            </Section>

            {/* Delete */}
            <div className="border-t border-red-500/20 pt-4">
              {showDeleteConfirm ? (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-red-400 font-medium">¿Eliminar este criadero permanentemente?</p>
                  <p className="text-xs text-fg-mute">Se desvincularán todos los perros del criadero y se eliminarán los formularios y solicitudes.</p>
                  <div className="flex gap-2">
                    <button onClick={deleteKennel} disabled={deleting}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1.5">
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      {deleting ? 'Eliminando...' : 'Confirmar'}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="text-fg-dim hover:text-fg px-4 py-2 text-sm">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/5 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-500/10 transition">
                  <Trash2 className="w-4 h-4" /> Eliminar criadero
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-hair flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-chip transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving || loading || !form.name.trim()}
            className="bg-paper-50 text-ink-900 hover:opacity-90 font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-hair">
        <Icon className="w-4 h-4 text-[#D74709]" />
        <h3 className="text-xs font-semibold text-fg-dim uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-fg-mute uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}
