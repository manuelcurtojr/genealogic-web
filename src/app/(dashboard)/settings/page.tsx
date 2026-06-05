'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Shield, Loader2, Check, Lock, Globe, Bell, Eye,
  Download, Trash2, CreditCard, Crown, Monitor,
  ChevronRight, AlertTriangle, EyeOff, AtSign, PhoneCall,
  Languages, CalendarDays, Coins, Clock, FileJson
} from 'lucide-react'
import AvatarUpload from '@/components/settings/avatar-upload'
import NotificationsSection from '@/components/settings/notifications-section'
import { getRoleLabel, getRoleBadge, getPlanLabel } from '@/lib/permissions'
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

type Section =
  | 'perfil'
  | 'suscripcion'
  | 'facturacion'
  | 'seguridad'
  | 'idioma'
  | 'notificaciones'
  | 'privacidad'
  | 'datos'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  // ¿El usuario tiene criadero? Un owner puro (sin kennel) ve el plan como
  // "Owner" (no "Kennel Free") y NO ve las pestañas Suscripción/Facturación.
  const [hasKennel, setHasKennel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('perfil')

  // Form states
  const [form, setForm] = useState({
    display_name: '', phone: '', country: '', city: '', bio: '',
    language: 'es', date_format: 'DD/MM/YYYY', currency: 'EUR', timezone: '',
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
  // Typed confirmation: el user debe escribir literalmente "ELIMINAR" para
  // habilitar el botón final. Defensa contra clicks accidentales (la acción
  // borra perfil, perros sin descendientes, camadas y criadero entero).
  const [deleteTypedConfirm, setDeleteTypedConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
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
      const [{ data }, { data: kennelArr }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('kennels').select('id').eq('owner_id', user.id).limit(1),
      ])
      setProfile(data)
      setHasKennel((kennelArr?.length ?? 0) > 0)
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
    if (newPassword.length < 6) { setPasswordError(t('La contraseña debe tener al menos 6 caracteres')); return }
    if (newPassword !== confirmPassword) { setPasswordError(t('Las contraseñas no coinciden')); return }
    setPasswordLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) { setPasswordError(error.message); return }
    setPasswordSuccess(true)
    setNewPassword(''); setConfirmPassword(''); setShowPassword(false)
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>

  const userRole = profile?.role || 'owner'
  const userPlan: string = (profile as any)?.plan || 'free'
  const userIsFounder: boolean = Boolean((profile as any)?.plan_is_founder)
  // getPlanLabel distingue "Owner" (free sin kennel) de "Kennel Free" (free
  // con kennel) usando hasKennel; antes el mapeo inline caía siempre en
  // "Kennel Free", mostrándole a un propietario un plan de criador.
  const userPlanLabel = getPlanLabel(userPlan, hasKennel)
  // Un owner puro (sin kennel, plan free) no tiene suscripción ni facturación
  // que gestionar: ocultamos esas dos pestañas. El resto se quedan para todos.
  const showBilling = hasKennel
  const sections: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: 'perfil',         label: t('Perfil'),           icon: User },
    ...(showBilling ? [
      { key: 'suscripcion' as Section,  label: t('Suscripción'),  icon: Crown },
      { key: 'facturacion' as Section,  label: t('Facturación'),  icon: CreditCard },
    ] : []),
    { key: 'seguridad',      label: t('Seguridad'),        icon: Lock },
    { key: 'idioma',         label: t('Idioma y región'),  icon: Globe },
    { key: 'notificaciones', label: t('Notificaciones'),   icon: Bell },
    { key: 'privacidad',     label: t('Privacidad'),       icon: Eye },
    { key: 'datos',          label: t('Datos'),            icon: Download },
  ]

  return (
    <div className="max-w-5xl space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Cuenta')}</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {t('Ajustes')}
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-body">
          {t('Gestiona tu perfil, seguridad, idioma, notificaciones y privacidad desde un solo lugar.')}
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-10">
        {/* Sidebar navigation */}
        <div className="hidden w-56 flex-shrink-0 md:block">
          <nav className="sticky top-24 space-y-1">
            {sections.map(s => {
              const Icon = s.icon
              const active = activeSection === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium transition-all ${
                    active
                      ? 'bg-surface-card text-ink'
                      : 'text-body hover:bg-surface-soft hover:text-ink'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[color:var(--brand)]" />
                  )}
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
                        : 'text-muted group-hover:text-ink'
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  {s.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Mobile section tabs */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden">
            {sections.map(s => {
              const Icon = s.icon
              const active = activeSection === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                    active
                      ? 'bg-ink text-on-primary'
                      : 'border border-hairline bg-canvas text-body hover:bg-surface-soft hover:text-ink'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* === PERFIL === */}
          {activeSection === 'perfil' && (
            <div className="space-y-4">
              <SectionHeader icon={User} title={t('Perfil personal')} desc={t('Tu información personal y avatar')} />
              <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-4 sm:mb-6">
                  <AvatarUpload userId={profile?.id} currentUrl={profile?.avatar_url} displayName={form.display_name} onUploaded={(url) => setProfile((prev: any) => ({ ...prev, avatar_url: url }))} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{form.display_name || t('Sin nombre')}</p>
                    <p className="truncate text-xs text-muted">{profile?.email}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadge(userRole).bg}`}>{getRoleLabel(userRole)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t('Nombre para mostrar')} value={form.display_name} onChange={v => set('display_name', v)} />
                  <Field label={t('Teléfono')} value={form.phone} onChange={v => set('phone', v)} placeholder="+34 600 000 000" />
                  {/* Country selector */}
                  <div className="relative">
                    <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('País')}</label>
                    <button type="button" onClick={() => { setCountryOpen(!countryOpen); setCityOpen(false) }}
                      className={`w-full rounded-lg border bg-canvas px-3 py-2 text-[14px] flex items-center gap-2 transition-colors text-left ${countryOpen ? "border-ink" : "border-hairline"}`}>
                      {selectedCountry ? <><span className="text-base">{selectedCountry.flag}</span><span className="truncate flex-1">{selectedCountry.name}</span></> : <span className="text-muted flex-1">{t('Seleccionar país')}</span>}
                    </button>
                    {countryOpen && (
                      <div className="absolute z-30 mt-1 w-full bg-surface-card border border-hairline rounded-lg shadow-xl max-h-48 flex flex-col">
                        <div className="p-2 border-b border-hairline">
                          <input autoFocus value={countryQ} onChange={e => setCountryQ(e.target.value)} placeholder={t('Buscar país...')}
                            className="w-full rounded border border-hairline bg-canvas px-3 py-1.5 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink" />
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {filteredCountries.map(c => (
                            <button key={c.code} type="button" onClick={() => { set('country', c.name); set('city', ''); setCountryOpen(false); setCountryQ('') }}
                              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${c.name === form.country ? 'bg-surface-card text-ink font-medium' : 'text-body hover:bg-surface-soft'}`}>
                              <span className="text-base">{c.flag}</span> {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* City selector */}
                  <div className="relative">
                    <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('Ciudad')}</label>
                    <input type="text" value={form.city || cityQ} readOnly={!!form.city}
                      onChange={e => { if (!form.city) handleCitySearch(e.target.value) }}
                      onClick={() => { if (form.city) { set('city', ''); setCityQ('') } }}
                      disabled={!selectedCountry}
                      placeholder={selectedCountry ? t('Buscar ciudad...') : t('Primero selecciona país')}
                      className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition disabled:opacity-40" />
                    {cityOpen && cityResults.length > 0 && (
                      <div className="absolute z-30 mt-1 w-full bg-surface-card border border-hairline rounded-lg shadow-xl max-h-40 overflow-y-auto">
                        {cityResults.map(c => (
                          <button key={c} type="button" onClick={() => { set('city', c); setCityOpen(false); setCityQ('') }}
                            className="w-full text-left px-3 py-2 text-sm text-body hover:bg-surface-soft">{c}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('Biografía')}</label>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={2} placeholder={t('Cuéntanos sobre ti...')}
                    className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition resize-none" />
                </div>
                <SaveButton saving={saving} onClick={handleSave} t={t} />
              </div>
            </div>
          )}

          {/* === SUSCRIPCIÓN === */}
          {showBilling && activeSection === 'suscripcion' && (
            <div className="space-y-4">
              <SectionHeader icon={Crown} title={t('Suscripción')} desc={t('Plan actual y opciones de upgrade')} />
              <div className="rounded-2xl border border-ink bg-canvas p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink text-on-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">
                  <Crown className="w-3 h-3" />
                  {t('Activa')}
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1">
                  {t('Plan actual')}
                </p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-ink">Genealogic {userPlanLabel}</h2>
                  {userIsFounder && (
                    <span className="inline-flex items-center rounded-full bg-surface-card border border-hairline px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
                      {t('Cuenta vitalicia interna')}
                    </span>
                  )}
                </div>
                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  <Link
                    href="/cuenta/suscripcion"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink text-on-primary px-4 py-2 text-sm font-semibold hover:opacity-90"
                  >
                    {t('Ver detalle del plan')}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <p className="text-xs text-muted">
                {t('Beneficios incluidos, comparación de planes y upgrade en')}{' '}
                <Link href="/cuenta/suscripcion" className="font-semibold text-ink hover:underline">
                  /cuenta/suscripción
                </Link>
                .
              </p>
            </div>
          )}

          {/* === FACTURACIÓN === */}
          {showBilling && activeSection === 'facturacion' && (
            <div className="space-y-4">
              <SectionHeader icon={CreditCard} title={t('Facturación')} desc={t('Historial de pagos y datos fiscales')} />
              <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-soft)]">
                    <CreditCard className="h-5 w-5 text-[color:var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t('Stripe en preparación')}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {t('Por ahora la facturación se gestiona manualmente. Próximamente verás historial de pagos, método de pago y descarga de facturas aquí.')}
                    </p>
                  </div>
                </div>
                <Link
                  href="/cuenta/facturacion"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
                >
                  {t('Abrir facturación completa')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-xs text-muted">
                {t('Si necesitas factura ahora mismo, escríbeme a')}{' '}
                <a href="mailto:hola@genealogic.io" className="text-ink underline">
                  hola@genealogic.io
                </a>
                .
              </p>
            </div>
          )}

          {/* === SEGURIDAD === */}
          {activeSection === 'seguridad' && (
            <div className="space-y-4">
              <SectionHeader icon={Lock} title={t('Contraseña y seguridad')} desc={t('Gestiona tu contraseña de acceso')} />
              <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
                {passwordSuccess && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 mb-4 flex items-center gap-2"><Check className="w-4 h-4" /> {t('Contraseña actualizada correctamente')}</div>}
                {!showPassword ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-soft)]">
                        <Lock className="h-[18px] w-[18px] text-[color:var(--brand)]" />
                      </div>
                      <div><p className="text-sm font-medium text-ink">{t('Contraseña')}</p><p className="text-xs text-muted">••••••••</p></div>
                    </div>
                    <button onClick={() => setShowPassword(true)} className="flex-shrink-0 rounded-lg border border-hairline bg-canvas px-3.5 py-1.5 text-sm font-medium text-ink transition hover:bg-surface-soft">{t('Cambiar')}</button>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    {passwordError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{passwordError}</div>}
                    <Field label={t('Nueva contraseña')} value={newPassword} onChange={v => setNewPassword(v)} type="password" placeholder={t('Mínimo 6 caracteres')} />
                    <Field label={t('Confirmar contraseña')} value={confirmPassword} onChange={v => setConfirmPassword(v)} type="password" />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button type="submit" disabled={passwordLoading} className="bg-ink text-on-primary hover:opacity-90 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">{passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}{t('Cambiar contraseña')}</button>
                      <button type="button" onClick={() => { setShowPassword(false); setPasswordError('') }} className="px-4 py-2 rounded-lg text-xs sm:text-sm border border-hairline bg-canvas text-body hover:bg-surface-soft transition">{t('Cancelar')}</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sessions */}
              <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-ink">{t('Sesiones activas')}</h3>
                </div>
                <div className="rounded-xl border border-hairline bg-surface-soft p-3 flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                    <Monitor className="h-[18px] w-[18px] text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink flex items-center gap-2">{t('Sesión actual')} <span className="text-[9px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-full">{t('Activa')}</span></p>
                    <p className="truncate text-xs text-muted">{typeof navigator !== 'undefined' ? navigator.userAgent.split('(')[1]?.split(')')[0] || t('Navegador') : t('Navegador')}</p>
                  </div>
                </div>
                {sessionsSuccess && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> {t('Todas las sesiones han sido cerradas')}</div>}
                <button
                  onClick={async () => {
                    if (!confirm(t('¿Cerrar la sesión en TODOS tus dispositivos? Tendrás que volver a iniciar sesión en cada uno.'))) return
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
                  {t('Cerrar todas las sesiones')}
                </button>
                <p className="text-[10px] text-muted mt-2">{t('Esto cerrará tu sesión en todos los dispositivos, incluyendo este.')}</p>
              </div>
            </div>
          )}

          {/* === IDIOMA === */}
          {activeSection === 'idioma' && (
            <div className="space-y-4">
              <SectionHeader icon={Globe} title={t('Idioma y región')} desc={t('Configura tu idioma, moneda y formato de fecha')} />
              <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6 space-y-4">
                <div>
                  <SelectLabel icon={Languages} label={t('Idioma')} />
                  <select value={form.language} onChange={e => set('language', e.target.value)}
                    className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none">
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <SelectLabel icon={CalendarDays} label={t('Formato de fecha')} />
                    <select value={form.date_format} onChange={e => set('date_format', e.target.value)}
                      className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none">
                      {DATE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <SelectLabel icon={Coins} label={t('Moneda preferida')} />
                    <select value={form.currency} onChange={e => set('currency', e.target.value)}
                      className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none">
                      {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <SelectLabel icon={Clock} label={t('Zona horaria')} />
                  <input type="text" value={form.timezone} onChange={e => set('timezone', e.target.value)}
                    className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition" />
                </div>
                <SaveButton saving={saving} onClick={handleSave} t={t} />
              </div>
            </div>
          )}

          {/* === NOTIFICACIONES === */}
          {activeSection === 'notificaciones' && (
            <div className="space-y-4">
              <SectionHeader icon={Bell} title={t('Notificaciones')} desc={t('Elige qué correos quieres recibir. Se guardan al instante.')} />
              <NotificationsSection t={t} />
            </div>
          )}

          {/* === PRIVACIDAD === */}
          {activeSection === 'privacidad' && (
            <div className="space-y-4">
              <SectionHeader icon={Eye} title={t('Privacidad')} desc={t('Controla qué información es visible para otros')} />
              <div className="rounded-2xl border border-hairline bg-canvas p-2 sm:p-2.5">
                <div className="divide-y divide-hairline">
                  <Toggle icon={form.public_profile ? Eye : EyeOff} label={t('Perfil público visible')} desc={t('Otros usuarios pueden ver tu perfil')} value={form.public_profile} onChange={v => set('public_profile', v)} />
                  <Toggle icon={AtSign} label={t('Mostrar email en perfil')} desc={t('Tu email será visible en tu perfil público')} value={form.show_email} onChange={v => set('show_email', v)} />
                  <Toggle icon={PhoneCall} label={t('Mostrar teléfono en perfil')} desc={t('Tu teléfono será visible en tu perfil público')} value={form.show_phone} onChange={v => set('show_phone', v)} />
                </div>
              </div>
              <SaveButton saving={saving} onClick={handleSave} t={t} />
            </div>
          )}

          {/* === DATOS === */}
          {activeSection === 'datos' && (
            <div className="space-y-4">
              <SectionHeader icon={Download} title={t('Datos y exportación')} desc={t('Exporta o elimina tu información')} />
              <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-soft)]">
                      <FileJson className="h-5 w-5 text-[color:var(--brand)]" />
                    </div>
                    <div><p className="text-sm font-medium text-ink">{t('Exportar mis datos')}</p><p className="text-xs text-muted">{t('Descarga todos tus datos en formato JSON')}</p></div>
                  </div>
                  <button onClick={() => window.location.href = '/api/export-data'} className="flex-shrink-0 rounded-lg border border-hairline bg-canvas px-3.5 py-1.5 text-sm font-medium text-ink transition hover:bg-surface-soft">{t('Exportar')}</button>
                </div>
              </div>
              {/* Danger zone */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" /> {t('Zona de peligro')}</h3>
                {!deleteConfirm ? (
                  <>
                    <p className="text-xs text-muted mb-4">{t('Eliminar tu cuenta es una acción permanente. Antes de proceder, ten en cuenta lo siguiente:')}</p>
                    <div className="space-y-2 mb-4 text-xs">
                      <div className="flex items-start gap-2 text-body"><Trash2 className="w-3 h-3 mt-0.5 text-red-400 flex-shrink-0" /><span><strong className="text-ink">{t('Se eliminará:')}</strong> {t('tu perfil, contactos, notificaciones, formularios')}</span></div>
                      <div className="flex items-start gap-2 text-body"><Shield className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" /><span><strong className="text-ink">{t('Se anonimizará:')}</strong> {t('perros con descendientes o que aparezcan en genealogías de otros usuarios se mantendrán como')} &quot;{t('Propietario eliminado')}&quot;</span></div>
                      <div className="flex items-start gap-2 text-body"><Shield className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" /><span><strong className="text-ink">{t('Criadero histórico:')}</strong> {t('si tu criadero tiene perros o camadas, se mantendrá como perfil público sin datos de contacto')}</span></div>
                      <div className="flex items-start gap-2 text-body"><Check className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" /><span><strong className="text-ink">{t('Sí se eliminan:')}</strong> {t('perros sin descendientes ni camadas, camadas sin cachorros, criaderos vacíos')}</span></div>
                    </div>
                    <button onClick={() => setDeleteConfirm(true)} className="text-sm text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition">{t('Quiero eliminar mi cuenta')}</button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-red-400 font-semibold">{t('¿Estás completamente seguro?')}</p>
                    <p className="text-xs text-muted">{t('Esta acción no se puede deshacer. La información genealógica importante se preservará de forma anónima.')}</p>
                    <div>
                      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1.5 block">
                        {t('Escribe')} <code className="bg-red-500/15 text-red-400 px-1 rounded font-mono">ELIMINAR</code> {t('para confirmar')}
                      </label>
                      <input
                        type="text"
                        value={deleteTypedConfirm}
                        onChange={(e) => setDeleteTypedConfirm(e.target.value)}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="ELIMINAR"
                        className="w-full bg-canvas border border-red-500/30 rounded-lg px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-red-500 focus:outline-none transition"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <button
                        onClick={async () => {
                          if (deleteTypedConfirm.trim() !== 'ELIMINAR') return
                          setDeleting(true)
                          try {
                            await fetch('/api/delete-account', { method: 'POST' })
                            window.location.href = '/'
                          } catch {
                            setDeleting(false)
                          }
                        }}
                        disabled={deleteTypedConfirm.trim() !== 'ELIMINAR' || deleting}
                        className="text-xs sm:text-sm text-white bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition font-semibold flex items-center gap-2"
                      >
                        {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {deleting ? t('Eliminando…') : t('Confirmar eliminación')}
                      </button>
                      <button
                        onClick={() => { setDeleteConfirm(false); setDeleteTypedConfirm('') }}
                        disabled={deleting}
                        className="text-xs sm:text-sm text-muted hover:text-ink transition disabled:opacity-50"
                      >
                        {t('Cancelar')}
                      </button>
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

function SectionHeader({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.03em] text-ink">{title}</h2>
        <p className="mt-0.5 text-[13px] text-muted">{desc}</p>
      </div>
    </div>
  )
}

function SelectLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-body">
      <Icon className="h-3.5 w-3.5 text-muted" />
      {label}
    </label>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-body">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
      />
    </div>
  )
}

function Toggle({ icon: Icon, label, desc, value, onChange }: { icon: React.ElementType; label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-3.5 sm:px-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-ink">{label}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{desc}</p>
        </div>
      </div>
      <ToggleSwitch value={value} onChange={onChange} color="bg-[color:var(--brand)]" className="flex-shrink-0" />
    </div>
  )
}

function SaveButton({ saving, onClick, t }: { saving: boolean; onClick: () => void; t: (k: string) => string }) {
  return (
    <div className="flex justify-end pt-4">
      <button
        onClick={onClick}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? t('Guardando…') : t('Guardar cambios')}
      </button>
    </div>
  )
}
