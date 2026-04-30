'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Mail, Shield, Loader2, Check, Lock, Globe, Bell, Eye, EyeOff,
  Download, Trash2, CreditCard, Calendar, Phone, MapPin, Crown,
  ChevronRight, AlertTriangle
} from 'lucide-react'
import AvatarUpload from '@/components/settings/avatar-upload'
import { getRoleLabel, getRoleBadge } from '@/lib/permissions'
import { getLocalizedCountries, searchCities } from '@/lib/countries'
import { getTranslator } from '@/lib/i18n'

const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
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

// Plan info is now in lib/permissions.ts

type Section = 'perfil' | 'seguridad' | 'idioma' | 'notificaciones' | 'privacidad' | 'datos'

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
    notif_email: true, notif_submissions: true, notif_vet: true, notif_calendar: true,
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
  const [closingAllSessions, setClosingAllSessions] = useState(false)
  const [sessionsSuccess, setSessionsSuccess] = useState(false)

  // Country/City autocomplete
  const countries = getLocalizedCountries()
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryQ, setCountryQ] = useState('')
  const [cityOpen, setCityOpen] = useState(false)
  const [cityQ, setCityQ] = useState('')
  const [cityResults, setCityResults] = useState<string[]>([])
  const [cityLoading, setCityLoading] = useState(false)

  const selectedCountry = countries.find(c => c.name === form.country)
  const filteredCountries = countryQ ? countries.filter(c => c.name.toLowerCase().includes(countryQ.toLowerCase())) : countries

  async function handleCitySearch(q: string) {
    setCityQ(q)
    if (q.length < 2 || !selectedCountry) { setCityResults([]); return }
    setCityLoading(true)
    const results = await searchCities(selectedCountry.code, q)
    setCityResults(results)
    setCityOpen(results.length > 0)
    setCityLoading(false)
  }

  // i18n translator
  const t = getTranslator(form.language)

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
    const oldLang = profile?.language || 'es'
    await supabase.from('profiles').update({
      display_name: form.display_name.trim() || null,
      phone: form.phone || null, country: form.country || null,
      city: form.city || null, bio: form.bio || null,
      language: form.language, date_format: form.date_format,
      currency: form.currency, timezone: form.timezone,
      notif_email: form.notif_email, notif_submissions: form.notif_submissions,
      notif_vet: form.notif_vet, notif_calendar: form.notif_calendar,
      public_profile: form.public_profile, show_email: form.show_email,
      show_phone: form.show_phone,
    }).eq('id', profile.id)
    // Store language in localStorage for client-side components
    localStorage.setItem('genealogic-lang', form.language)
    setProfile((prev: any) => ({ ...prev, ...form }))
    setSaving(false)
    // If language changed, reload to apply translations everywhere
    if (form.language !== oldLang) {
      window.location.reload()
    }
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-fg-mute" /></div>

  const userRole = profile?.role || 'owner'
  const sections: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: 'perfil', label: 'Perfil', icon: User },
    { key: 'seguridad', label: 'Seguridad', icon: Lock },
    { key: 'idioma', label: 'Idioma y región', icon: Globe },
    { key: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { key: 'privacidad', label: 'Privacidad', icon: Eye },
    { key: 'datos', label: 'Datos', icon: Download },
  ]

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Ajustes</h1>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
        {/* Sidebar navigation */}
        <div className="w-48 flex-shrink-0 hidden md:block">
          <nav className="space-y-1 sticky top-24">
            {sections.map(s => {
              const Icon = s.icon
              return (
                <button key={s.key} onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition text-left ${activeSection === s.key ? 'bg-[#D74709]/15 text-[#D74709] font-semibold' : 'text-fg-dim hover:text-fg hover:bg-chip'}`}>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${activeSection === s.key ? 'bg-[#D74709]/15 text-[#D74709]' : 'bg-chip text-fg-mute'}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* === PERFIL === */}
          {activeSection === 'perfil' && (
            <div className="space-y-4">
              <SectionHeader title="Perfil personal" desc="Tu información personal y avatar" />
              <div className="bg-chip border border-hair rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <AvatarUpload userId={profile?.id} currentUrl={profile?.avatar_url} displayName={form.display_name} onUploaded={(url) => setProfile((prev: any) => ({ ...prev, avatar_url: url }))} />
                  <div>
                    <p className="font-semibold">{form.display_name || 'Sin nombre'}</p>
                    <p className="text-xs text-fg-mute">{profile?.email}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getRoleBadge(userRole).bg}`}>{getRoleLabel(userRole)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nombre para mostrar" value={form.display_name} onChange={v => set('display_name', v)} />
                  <Field label="Teléfono" value={form.phone} onChange={v => set('phone', v)} placeholder="+34 600 000 000" />
                  {/* Country selector */}
                  <div className="relative">
                    <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">País</label>
                    <button type="button" onClick={() => { setCountryOpen(!countryOpen); setCityOpen(false) }}
                      className={`w-full bg-chip border rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition text-left ${countryOpen ? 'border-[#D74709]' : 'border-hair'}`}>
                      {selectedCountry ? <><span className="text-base">{selectedCountry.flag}</span><span className="truncate flex-1">{selectedCountry.name}</span></> : <span className="text-fg-mute flex-1">Seleccionar país</span>}
                    </button>
                    {countryOpen && (
                      <div className="absolute z-30 mt-1 w-full bg-ink-800 border border-hair rounded-lg shadow-xl max-h-48 flex flex-col">
                        <div className="p-2 border-b border-hair">
                          <input autoFocus value={countryQ} onChange={e => setCountryQ(e.target.value)} placeholder="Buscar país..."
                            className="w-full bg-chip border border-hair rounded pl-3 pr-3 py-1.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {filteredCountries.map(c => (
                            <button key={c.code} type="button" onClick={() => { set('country', c.name); set('city', ''); setCountryOpen(false); setCountryQ('') }}
                              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${c.name === form.country ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-fg hover:bg-chip'}`}>
                              <span className="text-base">{c.flag}</span> {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* City selector */}
                  <div className="relative">
                    <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Ciudad</label>
                    <input type="text" value={form.city || cityQ} readOnly={!!form.city}
                      onChange={e => { if (!form.city) handleCitySearch(e.target.value) }}
                      onClick={() => { if (form.city) { set('city', ''); setCityQ('') } }}
                      disabled={!selectedCountry}
                      placeholder={selectedCountry ? 'Buscar ciudad...' : 'Primero selecciona país'}
                      className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition disabled:opacity-40" />
                    {cityOpen && cityResults.length > 0 && (
                      <div className="absolute z-30 mt-1 w-full bg-ink-800 border border-hair rounded-lg shadow-xl max-h-40 overflow-y-auto">
                        {cityResults.map(c => (
                          <button key={c} type="button" onClick={() => { set('city', c); setCityOpen(false); setCityQ('') }}
                            className="w-full text-left px-3 py-2 text-sm text-fg hover:bg-chip">{c}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Biografía</label>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={2} placeholder="Cuéntanos sobre ti..."
                    className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition resize-none" />
                </div>
                <SaveButton saving={saving} onClick={handleSave} />
              </div>
            </div>
          )}

          {/* === SEGURIDAD === */}
          {activeSection === 'seguridad' && (
            <div className="space-y-4">
              <SectionHeader title="Contraseña y seguridad" desc="Gestiona tu contraseña de acceso" />
              <div className="bg-chip border border-hair rounded-xl p-4 sm:p-5">
                {passwordSuccess && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 mb-4 flex items-center gap-2"><Check className="w-4 h-4" /> Contraseña actualizada correctamente</div>}
                {!showPassword ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Lock className="w-4 h-4 text-fg-mute" /><div><p className="text-sm font-medium">Contraseña</p><p className="text-xs text-fg-mute">••••••••</p></div></div>
                    <button onClick={() => setShowPassword(true)} className="text-sm text-[#D74709] hover:text-[#c03d07] transition font-medium">Cambiar</button>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    {passwordError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{passwordError}</div>}
                    <Field label="Nueva contraseña" value={newPassword} onChange={v => setNewPassword(v)} type="password" placeholder="Mínimo 6 caracteres" />
                    <Field label="Confirmar contraseña" value={confirmPassword} onChange={v => setConfirmPassword(v)} type="password" />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="submit" disabled={passwordLoading} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">{passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}Cambiar contraseña</button>
                      <button type="button" onClick={() => { setShowPassword(false); setPasswordError('') }} className="px-4 py-2 rounded-lg text-xs sm:text-sm bg-chip text-fg-dim hover:bg-chip transition">Cancelar</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sessions */}
              <div className="bg-chip border border-hair rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Sesiones activas</h3>
                </div>
                <div className="bg-chip rounded-lg p-3 flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-2">Sesión actual <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full">Activa</span></p>
                    <p className="text-xs text-fg-mute">{typeof navigator !== 'undefined' ? navigator.userAgent.split('(')[1]?.split(')')[0] || 'Navegador' : 'Navegador'}</p>
                  </div>
                </div>
                {sessionsSuccess && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> Todas las sesiones han sido cerradas</div>}
                <button
                  onClick={async () => {
                    setClosingAllSessions(true)
                    const supabase = createClient()
                    await supabase.auth.signOut({ scope: 'global' })
                    setClosingAllSessions(false)
                    setSessionsSuccess(true)
                    setTimeout(() => { window.location.href = '/login' }, 1500)
                  }}
                  disabled={closingAllSessions}
                  className="text-sm text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50 flex items-center gap-2">
                  {closingAllSessions && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cerrar todas las sesiones
                </button>
                <p className="text-[10px] text-fg-mute mt-2">Esto cerrará tu sesión en todos los dispositivos, incluyendo este.</p>
              </div>
            </div>
          )}

          {/* === IDIOMA === */}
          {activeSection === 'idioma' && (
            <div className="space-y-4">
              <SectionHeader title="Idioma y región" desc="Configura tu idioma, moneda y formato de fecha" />
              <div className="bg-chip border border-hair rounded-xl p-4 sm:p-5 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Idioma</label>
                  <select value={form.language} onChange={e => set('language', e.target.value)}
                    className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Formato de fecha</label>
                    <select value={form.date_format} onChange={e => set('date_format', e.target.value)}
                      className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
                      {DATE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Moneda preferida</label>
                    <select value={form.currency} onChange={e => set('currency', e.target.value)}
                      className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
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
              <div className="bg-chip border border-hair rounded-xl p-4 sm:p-5 space-y-3">
                <Toggle label="Notificaciones por email" desc="Recibir notificaciones importantes por correo" value={form.notif_email} onChange={v => set('notif_email', v)} />
                <Toggle label="Nuevas solicitudes" desc="Cuando alguien rellena tu formulario de contacto" value={form.notif_submissions} onChange={v => set('notif_submissions', v)} />
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
              <div className="bg-chip border border-hair rounded-xl p-4 sm:p-5 space-y-3">
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
              <div className="bg-chip border border-hair rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><Download className="w-5 h-5 text-blue-400 flex-shrink-0" /><div><p className="text-sm font-medium">Exportar mis datos</p><p className="text-xs text-fg-mute">Descarga todos tus datos en formato JSON</p></div></div>
                  <button onClick={() => window.location.href = '/api/export-data'} className="text-sm text-blue-400 hover:text-blue-300 font-medium transition">Exportar</button>
                </div>
              </div>
              {/* Danger zone */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" /> Zona de peligro</h3>
                {!deleteConfirm ? (
                  <>
                    <p className="text-xs text-fg-mute mb-4">Eliminar tu cuenta es una acción permanente. Antes de proceder, ten en cuenta lo siguiente:</p>
                    <div className="space-y-2 mb-4 text-xs">
                      <div className="flex items-start gap-2 text-fg-dim"><Trash2 className="w-3 h-3 mt-0.5 text-red-400 flex-shrink-0" /><span><strong className="text-fg">Se eliminará:</strong> tu perfil, contactos, notificaciones, formularios</span></div>
                      <div className="flex items-start gap-2 text-fg-dim"><Shield className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" /><span><strong className="text-fg">Se anonimizará:</strong> perros con descendientes o que aparezcan en pedigrees de otros usuarios se mantendrán como &quot;Propietario eliminado&quot;</span></div>
                      <div className="flex items-start gap-2 text-fg-dim"><Shield className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" /><span><strong className="text-fg">Criadero histórico:</strong> si tu criadero tiene perros o camadas, se mantendrá como perfil público sin datos de contacto</span></div>
                      <div className="flex items-start gap-2 text-fg-dim"><Check className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" /><span><strong className="text-fg">Sí se eliminan:</strong> perros sin descendientes ni camadas, camadas sin cachorros, criaderos vacíos</span></div>
                    </div>
                    <button onClick={() => setDeleteConfirm(true)} className="text-sm text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition">Quiero eliminar mi cuenta</button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-red-400 font-semibold">¿Estás completamente seguro?</p>
                    <p className="text-xs text-fg-mute">Esta acción no se puede deshacer. La información genealógica importante se preservará de forma anónima.</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <button onClick={async () => { await fetch('/api/delete-account', { method: 'POST' }); window.location.href = '/' }} className="text-xs sm:text-sm text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition font-semibold">Confirmar eliminación</button>
                      <button onClick={() => setDeleteConfirm(false)} className="text-xs sm:text-sm text-fg-mute hover:text-fg transition">Cancelar</button>
                    </div>
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
  return <div><h2 className="text-lg font-semibold">{title}</h2><p className="text-xs text-fg-mute mt-0.5">{desc}</p></div>
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-fg-mute">{desc}</p></div>
      <ToggleSwitch value={value} onChange={onChange} />
    </div>
  )
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="pt-3 flex justify-end">
      <button onClick={onClick} disabled={saving} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  )
}
