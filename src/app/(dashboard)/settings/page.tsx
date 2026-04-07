'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Mail, Shield, Loader2, Check, Lock, Globe, Bell, Eye, EyeOff,
  Download, Trash2, CreditCard, Calendar, Phone, MapPin, Crown, Gem,
  ChevronRight, AlertTriangle
} from 'lucide-react'
import AvatarUpload from '@/components/settings/avatar-upload'

const LANGUAGES = [
  { code: 'es', name: 'Español' }, { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' }, { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' }, { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' }, { code: 'pl', name: 'Polski' },
  { code: 'ru', name: 'Русский' }, { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' }, { code: 'ko', name: '한국어' },
  { code: 'ar', name: 'العربية' }, { code: 'tr', name: 'Türkçe' },
  { code: 'sv', name: 'Svenska' }, { code: 'da', name: 'Dansk' },
  { code: 'fi', name: 'Suomi' }, { code: 'no', name: 'Norsk' },
  { code: 'cs', name: 'Čeština' }, { code: 'ro', name: 'Română' },
  { code: 'hu', name: 'Magyar' }, { code: 'el', name: 'Ελληνικά' },
  { code: 'th', name: 'ไทย' }, { code: 'vi', name: 'Tiếng Việt' },
]

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
]

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro (EUR)' }, { value: 'USD', label: '$ Dólar (USD)' },
  { value: 'GBP', label: '£ Libra (GBP)' }, { value: 'MXN', label: '$ Peso MX (MXN)' },
  { value: 'COP', label: '$ Peso CO (COP)' }, { value: 'ARS', label: '$ Peso AR (ARS)' },
  { value: 'BRL', label: 'R$ Real (BRL)' }, { value: 'CLP', label: '$ Peso CL (CLP)' },
]

const PLANS = [
  { key: 'free', name: 'Free', price: 'Gratis', color: 'text-white/60 bg-white/10', features: ['Hasta 10 perros', 'Pedigree básico', 'CRM limitado'] },
  { key: 'pro', name: 'Pro', price: '9,99 €/mes', color: 'text-[#D74709] bg-[#D74709]/15', features: ['Perros ilimitados', 'Pedigree completo', 'CRM completo', 'Importador de pedigrees', 'Formularios de contacto', 'Analíticas avanzadas'] },
  { key: 'admin', name: 'Admin', price: 'Interno', color: 'text-purple-400 bg-purple-500/15', features: ['Todo incluido', 'Acceso total'] },
]

type Section = 'perfil' | 'seguridad' | 'plan' | 'idioma' | 'notificaciones' | 'privacidad' | 'datos'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('perfil')

  // Form states
  const [form, setForm] = useState({
    display_name: '', phone: '', country: '', city: '', bio: '',
    language: 'es', date_format: 'DD/MM/YYYY', currency: 'EUR', timezone: '',
    notif_email: true, notif_submissions: true, notif_deals: true, notif_vet: true, notif_calendar: true,
    public_profile: true, show_email: false, show_phone: false,
  })

  // Password
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      if (data) {
        setForm(prev => ({
          ...prev,
          display_name: data.display_name || '',
          phone: data.phone || '',
          country: data.country || '',
          city: data.city || '',
          bio: data.bio || '',
          language: data.language || 'es',
          date_format: data.date_format || 'DD/MM/YYYY',
          currency: data.currency || 'EUR',
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          notif_email: data.notif_email ?? true,
          notif_submissions: data.notif_submissions ?? true,
          notif_deals: data.notif_deals ?? true,
          notif_vet: data.notif_vet ?? true,
          notif_calendar: data.notif_calendar ?? true,
          public_profile: data.public_profile ?? true,
          show_email: data.show_email ?? false,
          show_phone: data.show_phone ?? false,
        }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      display_name: form.display_name.trim() || null,
      phone: form.phone || null, country: form.country || null,
      city: form.city || null, bio: form.bio || null,
      language: form.language, date_format: form.date_format,
      currency: form.currency, timezone: form.timezone,
      notif_email: form.notif_email, notif_submissions: form.notif_submissions,
      notif_deals: form.notif_deals, notif_vet: form.notif_vet,
      notif_calendar: form.notif_calendar,
      public_profile: form.public_profile, show_email: form.show_email,
      show_phone: form.show_phone,
    }).eq('id', profile.id)
    setProfile((prev: any) => ({ ...prev, ...form }))
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 6) { setPasswordError('La contraseña debe tener al menos 6 caracteres'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Las contraseñas no coinciden'); return }
    setPasswordLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) { setPasswordError(error.message); return }
    setPasswordSuccess(true)
    setNewPassword(''); setConfirmPassword(''); setShowPassword(false)
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>

  const currentPlan = PLANS.find(p => p.key === (profile?.role || 'free')) || PLANS[0]
  const sections: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: 'perfil', label: 'Perfil', icon: User },
    { key: 'seguridad', label: 'Seguridad', icon: Lock },
    { key: 'plan', label: 'Plan', icon: Crown },
    { key: 'idioma', label: 'Idioma y región', icon: Globe },
    { key: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { key: 'privacidad', label: 'Privacidad', icon: Eye },
    { key: 'datos', label: 'Datos', icon: Download },
  ]

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Ajustes</h1>

      <div className="flex gap-6">
        {/* Sidebar navigation */}
        <div className="w-48 flex-shrink-0 hidden md:block">
          <nav className="space-y-1 sticky top-24">
            {sections.map(s => {
              const Icon = s.icon
              return (
                <button key={s.key} onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition text-left ${activeSection === s.key ? 'bg-[#D74709]/15 text-[#D74709] font-semibold' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                  <Icon className="w-4 h-4" /> {s.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Mobile section tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            {sections.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${activeSection === s.key ? 'bg-[#D74709]/15 text-[#D74709]' : 'bg-white/5 text-white/40'}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* === PERFIL === */}
          {activeSection === 'perfil' && (
            <div className="space-y-4">
              <SectionHeader title="Perfil personal" desc="Tu información personal y avatar" />
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-4 mb-5">
                  <AvatarUpload userId={profile?.id} currentUrl={profile?.avatar_url} displayName={form.display_name} onUploaded={(url) => setProfile((prev: any) => ({ ...prev, avatar_url: url }))} />
                  <div>
                    <p className="font-semibold">{form.display_name || 'Sin nombre'}</p>
                    <p className="text-xs text-white/40">{profile?.email}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${currentPlan.color}`}>{currentPlan.name}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre para mostrar" value={form.display_name} onChange={v => set('display_name', v)} />
                  <Field label="Teléfono" value={form.phone} onChange={v => set('phone', v)} placeholder="+34 600 000 000" />
                  <Field label="País" value={form.country} onChange={v => set('country', v)} />
                  <Field label="Ciudad" value={form.city} onChange={v => set('city', v)} />
                </div>
                <div className="mt-3">
                  <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Biografía</label>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={2} placeholder="Cuéntanos sobre ti..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none" />
                </div>
                <SaveButton saving={saving} onClick={handleSave} />
              </div>
            </div>
          )}

          {/* === SEGURIDAD === */}
          {activeSection === 'seguridad' && (
            <div className="space-y-4">
              <SectionHeader title="Contraseña y seguridad" desc="Gestiona tu contraseña de acceso" />
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                {passwordSuccess && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 mb-4 flex items-center gap-2"><Check className="w-4 h-4" /> Contraseña actualizada correctamente</div>}
                {!showPassword ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Lock className="w-4 h-4 text-white/30" /><div><p className="text-sm font-medium">Contraseña</p><p className="text-xs text-white/40">••••••••</p></div></div>
                    <button onClick={() => setShowPassword(true)} className="text-sm text-[#D74709] hover:text-[#c03d07] transition font-medium">Cambiar</button>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    {passwordError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{passwordError}</div>}
                    <Field label="Nueva contraseña" value={newPassword} onChange={v => setNewPassword(v)} type="password" placeholder="Mínimo 6 caracteres" />
                    <Field label="Confirmar contraseña" value={confirmPassword} onChange={v => setConfirmPassword(v)} type="password" />
                    <div className="flex gap-2">
                      <button type="submit" disabled={passwordLoading} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2">{passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}Cambiar contraseña</button>
                      <button type="button" onClick={() => { setShowPassword(false); setPasswordError('') }} className="px-4 py-2 rounded-lg text-sm bg-white/5 text-white/50 hover:bg-white/10 transition">Cancelar</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* === PLAN === */}
          {activeSection === 'plan' && (
            <div className="space-y-4">
              <SectionHeader title="Plan y suscripción" desc="Gestiona tu plan actual y los genes" />
              {/* Current plan */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentPlan.color}`}><Crown className="w-5 h-5" /></div>
                    <div>
                      <p className="font-semibold">Plan {currentPlan.name}</p>
                      <p className="text-xs text-white/40">{currentPlan.price}</p>
                    </div>
                  </div>
                  <Link href="/pricing" className="text-sm text-[#D74709] hover:text-[#c03d07] font-medium flex items-center gap-1 transition">Cambiar plan <ChevronRight className="w-4 h-4" /></Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {currentPlan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/50"><Check className="w-3 h-3 text-green-400 flex-shrink-0" />{f}</div>
                  ))}
                </div>
              </div>
              {/* Genes */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Gem className="w-5 h-5 text-purple-400" /><div><p className="font-semibold">{profile?.genes?.toLocaleString() || 0} Genes</p><p className="text-xs text-white/40">Tu saldo actual</p></div></div>
                  <Link href="/pricing" className="text-sm text-purple-400 hover:text-purple-300 font-medium transition">Comprar genes</Link>
                </div>
              </div>
            </div>
          )}

          {/* === IDIOMA === */}
          {activeSection === 'idioma' && (
            <div className="space-y-4">
              <SectionHeader title="Idioma y región" desc="Configura tu idioma, moneda y formato de fecha" />
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Idioma</label>
                  <select value={form.language} onChange={e => set('language', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Formato de fecha</label>
                    <select value={form.date_format} onChange={e => set('date_format', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
                      {DATE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Moneda preferida</label>
                    <select value={form.currency} onChange={e => set('currency', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
                      {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <Field label="Zona horaria" value={form.timezone} onChange={v => set('timezone', v)} />
                <SaveButton saving={saving} onClick={handleSave} />
              </div>
            </div>
          )}

          {/* === NOTIFICACIONES === */}
          {activeSection === 'notificaciones' && (
            <div className="space-y-4">
              <SectionHeader title="Notificaciones" desc="Elige qué notificaciones quieres recibir" />
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <Toggle label="Notificaciones por email" desc="Recibir notificaciones importantes por correo" value={form.notif_email} onChange={v => set('notif_email', v)} />
                <Toggle label="Nuevas solicitudes" desc="Cuando alguien rellena tu formulario de contacto" value={form.notif_submissions} onChange={v => set('notif_submissions', v)} />
                <Toggle label="Negocios actualizados" desc="Cuando un negocio cambia de etapa" value={form.notif_deals} onChange={v => set('notif_deals', v)} />
                <Toggle label="Recordatorios veterinarios" desc="Próximas citas y vacunas" value={form.notif_vet} onChange={v => set('notif_vet', v)} />
                <Toggle label="Eventos del calendario" desc="Recordatorios de eventos próximos" value={form.notif_calendar} onChange={v => set('notif_calendar', v)} />
                <SaveButton saving={saving} onClick={handleSave} />
              </div>
            </div>
          )}

          {/* === PRIVACIDAD === */}
          {activeSection === 'privacidad' && (
            <div className="space-y-4">
              <SectionHeader title="Privacidad" desc="Controla qué información es visible para otros" />
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <Toggle label="Perfil público visible" desc="Otros usuarios pueden ver tu perfil" value={form.public_profile} onChange={v => set('public_profile', v)} />
                <Toggle label="Mostrar email en perfil" desc="Tu email será visible en tu perfil público" value={form.show_email} onChange={v => set('show_email', v)} />
                <Toggle label="Mostrar teléfono en perfil" desc="Tu teléfono será visible en tu perfil público" value={form.show_phone} onChange={v => set('show_phone', v)} />
                <SaveButton saving={saving} onClick={handleSave} />
              </div>
            </div>
          )}

          {/* === DATOS === */}
          {activeSection === 'datos' && (
            <div className="space-y-4">
              <SectionHeader title="Datos y exportación" desc="Exporta o elimina tu información" />
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Download className="w-5 h-5 text-blue-400" /><div><p className="text-sm font-medium">Exportar mis datos</p><p className="text-xs text-white/40">Descarga todos tus datos en formato JSON</p></div></div>
                  <button onClick={() => window.location.href = '/api/export-data'} className="text-sm text-blue-400 hover:text-blue-300 font-medium transition">Exportar</button>
                </div>
              </div>
              {/* Danger zone */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" /> Zona de peligro</h3>
                <p className="text-xs text-white/40 mb-4">Eliminar tu cuenta borrará permanentemente todos tus datos, perros, camadas, negocios y contactos. Esta acción no se puede deshacer.</p>
                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)} className="text-sm text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition">Eliminar mi cuenta</button>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-red-400">¿Estás seguro? Esta acción es irreversible.</p>
                    <button onClick={async () => { await fetch('/api/delete-account', { method: 'POST' }); window.location.href = '/' }} className="text-sm text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition font-semibold">Confirmar eliminación</button>
                    <button onClick={() => setDeleteConfirm(false)} className="text-sm text-white/40 hover:text-white transition">Cancelar</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return <div><h2 className="text-lg font-semibold">{title}</h2><p className="text-xs text-white/40 mt-0.5">{desc}</p></div>
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-white/40">{desc}</p></div>
      <button onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full transition relative flex-shrink-0 ${value ? 'bg-[#D74709]' : 'bg-white/20'}`}>
        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="pt-3 flex justify-end">
      <button onClick={onClick} disabled={saving} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  )
}
