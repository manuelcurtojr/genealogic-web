'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, User, Shield, Calendar, Globe, Bell, FileText, AlertTriangle, Check, Eye, Trash2, ExternalLink, Key, Mail } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  userId: string | null
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Propietario', color: '#6B7280' },
  { value: 'breeder', label: 'Criador', color: '#D74709' },
  { value: 'admin', label: 'Admin', color: '#EF4444' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo', color: '#10B981' },
  { value: 'suspended', label: 'Suspendido', color: '#F59E0B' },
  { value: 'banned', label: 'Baneado', color: '#EF4444' },
]

export default function AdminUserPanel({ open, onClose, onSaved, userId }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [activity, setActivity] = useState({ dogs: 0, kennels: 0, litters: 0 })
  const [impersonating, setImpersonating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [form, setForm] = useState({
    display_name: '', email: '', phone: '', country: '', city: '', bio: '',
    language: 'es', currency: 'EUR', timezone: '', date_format: 'DD/MM/YYYY',
    role: 'owner', status: 'active',
    admin_notes: '',
    public_profile: true, show_email: false, show_phone: false,
    notif_email: true, notif_submissions: true, notif_vet: true,
  })

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    async function load() {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (!p) { setLoading(false); return }
      setProfile(p)
      setForm({
        display_name: p.display_name || '', email: p.email || '', phone: p.phone || '',
        country: p.country || '', city: p.city || '', bio: p.bio || '',
        language: p.language || 'es', currency: p.currency || 'EUR', timezone: p.timezone || '',
        date_format: p.date_format || 'DD/MM/YYYY',
        role: p.role || 'owner', status: p.status || 'active',
        admin_notes: p.admin_notes || '',
        public_profile: p.public_profile ?? true, show_email: p.show_email ?? false, show_phone: p.show_phone ?? false,
        notif_email: p.notif_email ?? true, notif_submissions: p.notif_submissions ?? true,
        notif_vet: p.notif_vet ?? true,
      })

      // Load activity stats
      const [dogsRes, kennelsRes, littersRes] = await Promise.all([
        supabase.from('dogs').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
        supabase.from('kennels').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
        supabase.from('litters').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
      ])
      setActivity({
        dogs: dogsRes.count || 0, kennels: kennelsRes.count || 0,
        litters: littersRes.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [open, userId])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  const set = (f: string, v: any) => setForm(prev => ({ ...prev, [f]: v }))

  const handleSave = async () => {
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('profiles').update({
      display_name: form.display_name.trim() || null, email: form.email.trim() || null,
      phone: form.phone.trim() || null, country: form.country.trim() || null,
      city: form.city.trim() || null, bio: form.bio.trim() || null,
      language: form.language, currency: form.currency, timezone: form.timezone.trim() || null,
      date_format: form.date_format, role: form.role, status: form.status,
      admin_notes: form.admin_notes.trim() || null,
      public_profile: form.public_profile, show_email: form.show_email, show_phone: form.show_phone,
      notif_email: form.notif_email, notif_submissions: form.notif_submissions,
      notif_vet: form.notif_vet,
    }).eq('id', userId)
    if (err) setError(err.message)
    setSaving(false)
    onSaved()
    onClose()
  }

  const impersonate = async () => {
    if (!userId) return
    setImpersonating(true)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      } else {
        alert(data.error || 'Error al impersonar')
      }
    } catch { alert('Error de red') }
    setImpersonating(false)
  }

  const deleteUser = async () => {
    if (!userId) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'profiles', id: userId }),
      })
      const data = await res.json()
      if (data.success) {
        onSaved()
        onClose()
      } else {
        alert(data.error || 'Error al eliminar')
      }
    } catch { alert('Error de red') }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-xl z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">Editar usuario</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

            {/* Header with avatar */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white/5 border-2 border-white/10 flex-shrink-0">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-[#D74709] text-xl font-bold">{(form.display_name || '?')[0].toUpperCase()}</div>}
              </div>
              <div>
                <p className="font-bold">{form.display_name || 'Sin nombre'}</p>
                <p className="text-xs text-white/30">{form.email}</p>
                <p className="text-[10px] text-white/20">Registrado: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : '—'}</p>
              </div>
            </div>

            {/* Activity stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Perros', value: activity.dogs },
                { label: 'Criaderos', value: activity.kennels },
                { label: 'Camadas', value: activity.litters },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-[9px] text-white/30">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Section: Cuenta */}
            <Section title="Cuenta" icon={Shield}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rol">
                  <div className="flex gap-1">
                    {ROLE_OPTIONS.map(r => (
                      <button key={r.value} onClick={() => set('role', r.value)}
                        className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition ${form.role === r.value ? 'ring-2 ring-offset-1 ring-offset-gray-900' : 'opacity-50'}`}
                        style={{ background: r.color + '20', color: r.color }}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Estado">
                  <div className="flex gap-1">
                    {STATUS_OPTIONS.map(s => (
                      <button key={s.value} onClick={() => set('status', s.value)}
                        className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition ${form.status === s.value ? 'ring-2 ring-offset-1 ring-offset-gray-900' : 'opacity-50'}`}
                        style={{ background: s.color + '20', color: s.color }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </Section>

            {/* Section: Datos personales */}
            <Section title="Datos personales" icon={User}>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Nombre" value={form.display_name} onChange={v => set('display_name', v)} />
                <Input label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
                <Input label="Teléfono" value={form.phone} onChange={v => set('phone', v)} />
                <Input label="País" value={form.country} onChange={v => set('country', v)} />
                <Input label="Ciudad" value={form.city} onChange={v => set('city', v)} />
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">Bio</label>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none resize-none" />
                </div>
              </div>
            </Section>

            {/* Section: Preferencias */}
            <Section title="Preferencias" icon={Globe}>
              <div className="grid grid-cols-3 gap-3">
                <Select label="Idioma" value={form.language} onChange={v => set('language', v)}
                  options={[{ v: 'es', l: 'Español' }, { v: 'en', l: 'English' }, { v: 'fr', l: 'Français' }, { v: 'de', l: 'Deutsch' }, { v: 'pt', l: 'Português' }, { v: 'it', l: 'Italiano' }]} />
                <Select label="Moneda" value={form.currency} onChange={v => set('currency', v)}
                  options={[{ v: 'EUR', l: 'EUR €' }, { v: 'USD', l: 'USD $' }, { v: 'GBP', l: 'GBP £' }, { v: 'MXN', l: 'MXN $' }]} />
                <Select label="Formato fecha" value={form.date_format} onChange={v => set('date_format', v)}
                  options={[{ v: 'DD/MM/YYYY', l: 'DD/MM/YYYY' }, { v: 'MM/DD/YYYY', l: 'MM/DD/YYYY' }, { v: 'YYYY-MM-DD', l: 'YYYY-MM-DD' }]} />
              </div>
              <Input label="Zona horaria" value={form.timezone} onChange={v => set('timezone', v)} placeholder="Europe/Madrid" />
            </Section>

            {/* Section: Privacidad */}
            <Section title="Privacidad" icon={Bell}>
              <div className="space-y-2">
                {[
                  { key: 'public_profile', label: 'Perfil público' },
                  { key: 'show_email', label: 'Mostrar email' },
                  { key: 'show_phone', label: 'Mostrar teléfono' },
                  { key: 'notif_email', label: 'Notificaciones email' },
                  { key: 'notif_submissions', label: 'Notif. solicitudes' },
                  { key: 'notif_vet', label: 'Notif. veterinario' },
                ].map(t => (
                  <label key={t.key} className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[t.key]} onChange={e => set(t.key, e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#D74709] focus:ring-[#D74709] focus:ring-offset-0" />
                    {t.label}
                  </label>
                ))}
              </div>
            </Section>

            {/* Section: Notas admin */}
            <Section title="Notas del administrador" icon={FileText}>
              <textarea value={form.admin_notes} onChange={e => set('admin_notes', e.target.value)} rows={4}
                placeholder="Notas internas sobre este usuario (solo visibles para admins)..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#D74709] focus:outline-none resize-none" />
            </Section>

            {/* Section: Contraseña */}
            <Section title="Contraseña" icon={Key}>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">Establecer contraseña</label>
                  <div className="flex gap-2">
                    <input id="admin-pw" type="text" placeholder="Nueva contraseña..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-[#D74709] focus:outline-none" />
                    <button onClick={async () => {
                      const pw = (document.getElementById('admin-pw') as HTMLInputElement)?.value
                      if (!pw || pw.length < 6) { alert('Mínimo 6 caracteres'); return }
                      const supabase = createClient()
                      const res = await fetch('/api/admin/update-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, password: pw }) })
                      const data = await res.json()
                      if (data.ok) { alert('Contraseña actualizada'); (document.getElementById('admin-pw') as HTMLInputElement).value = '' }
                      else alert('Error: ' + (data.error || 'Desconocido'))
                    }} className="bg-[#D74709] hover:bg-[#c03d07] text-white text-xs font-semibold px-3 py-2 rounded-lg transition whitespace-nowrap">
                      Guardar
                    </button>
                  </div>
                </div>
                <button onClick={async () => {
                  if (!form.email) { alert('No tiene email'); return }
                  const res = await fetch('/api/admin/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email }) })
                  const data = await res.json()
                  if (data.ok) alert('Enlace de reseteo enviado a ' + form.email)
                  else alert('Error: ' + (data.error || 'Desconocido'))
                }} className="w-full flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition">
                  <Mail className="w-4 h-4" /> Enviar enlace de reseteo por email
                </button>
              </div>
            </Section>

            {/* Acciones admin */}
            <Section title="Acciones" icon={Shield}>
              <div className="space-y-2">
                <button onClick={impersonate} disabled={impersonating}
                  className="w-full flex items-center justify-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-500/20 transition disabled:opacity-50">
                  {impersonating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  {impersonating ? 'Generando enlace...' : 'Ver como este usuario'}
                </button>
                <a href={`/dogs?owner=${userId}`} target="_blank"
                  className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/60 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition">
                  <ExternalLink className="w-4 h-4" /> Ver perros del usuario
                </a>
              </div>
            </Section>

            {/* Danger zone */}
            <div className="border-t border-red-500/20 pt-4">
              {form.status !== 'active' && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Cuenta {form.status === 'suspended' ? 'suspendida' : 'baneada'}</p>
                    <p className="text-xs text-white/30 mt-0.5">Este usuario no puede acceder a la plataforma.</p>
                  </div>
                </div>
              )}
              {showDeleteConfirm ? (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-red-400 font-medium">¿Eliminar este usuario permanentemente?</p>
                  <p className="text-xs text-white/30">Se eliminarán todos sus datos: perros, camadas, negocios, favoritos, notificaciones y transacciones de genes. Esta acción NO se puede deshacer.</p>
                  <div className="flex gap-2">
                    <button onClick={deleteUser} disabled={deleting}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1.5">
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      {deleting ? 'Eliminando...' : 'Confirmar eliminación'}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="text-white/50 hover:text-white px-4 py-2 text-sm transition">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/5 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-500/10 transition">
                  <Trash2 className="w-4 h-4" /> Eliminar usuario
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving || loading}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  )
}

/* Helpers */
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <Icon className="w-4 h-4 text-[#D74709]" />
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none appearance-none">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">{label}</label>
      {children}
    </div>
  )
}
