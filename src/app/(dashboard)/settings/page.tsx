'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Shield, Loader2, Check, Lock } from 'lucide-react'
import AvatarUpload from '@/components/settings/avatar-upload'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Edit profile state
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Password state
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setDisplayName(data?.display_name || '')
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', user!.id)
    setProfile((prev: any) => ({ ...prev, display_name: displayName.trim() }))
    setSaving(false)
    setSaveSuccess(true)
    setEditing(false)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 6) { setPasswordError('La contrasena debe tener al menos 6 caracteres'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Las contrasenas no coinciden'); return }

    setPasswordLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) { setPasswordError(error.message); return }
    setPasswordSuccess(true)
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  const roleMap: Record<string, { label: string; color: string }> = {
    free: { label: 'Free', color: 'bg-white/10 text-white/60' },
    pro: { label: 'Pro', color: 'bg-[#D74709]/20 text-[#D74709]' },
    admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400' },
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
  }

  const roleBadge = roleMap[profile?.role || 'free']

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-8">Ajustes</h1>

      {/* Profile */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Perfil</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-[#D74709] hover:text-[#c03d07] transition">
              Editar
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <AvatarUpload
            userId={profile?.id}
            currentUrl={profile?.avatar_url}
            displayName={profile?.display_name || ''}
            onUploaded={(url) => setProfile((prev: any) => ({ ...prev, avatar_url: url }))}
          />
          <div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition" autoFocus />
                <button onClick={handleSaveProfile} disabled={saving || !displayName.trim()}
                  className="bg-[#D74709] hover:bg-[#c03d07] text-white px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                </button>
                <button onClick={() => { setEditing(false); setDisplayName(profile?.display_name || '') }}
                  className="text-white/40 hover:text-white text-sm transition">Cancelar</button>
              </div>
            ) : (
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {profile?.display_name}
                {saveSuccess && <Check className="w-4 h-4 text-green-400" />}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-white/50">{profile?.email}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleBadge.color}`}>{roleBadge.label}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <InfoRow icon={User} label="Nombre" value={profile?.display_name || '—'} />
          <InfoRow icon={Mail} label="Email" value={profile?.email || '—'} />
          <InfoRow icon={Shield} label="Genes" value={`${profile?.genes?.toLocaleString() || 0} genes`} />
        </div>
      </div>

      {/* Password */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Contrasena</h2>
          {!showPassword && (
            <button onClick={() => setShowPassword(true)} className="text-sm text-[#D74709] hover:text-[#c03d07] transition">
              Cambiar
            </button>
          )}
        </div>

        {passwordSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 mb-4 flex items-center gap-2">
            <Check className="w-4 h-4" /> Contrasena actualizada correctamente
          </div>
        )}

        {showPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{passwordError}</div>}

            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Nueva contrasena</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoFocus minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#D74709] focus:outline-none transition"
                placeholder="Minimo 6 caracteres" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Confirmar contrasena</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#D74709] focus:outline-none transition" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={passwordLoading}
                className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2">
                {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Cambiar contrasena
              </button>
              <button type="button" onClick={() => { setShowPassword(false); setPasswordError(''); setNewPassword(''); setConfirmPassword('') }}
                className="px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/15 text-white transition">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-3 text-sm text-white/50">
            <Lock className="w-4 h-4 text-white/30" />
            <span>••••••••</span>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-white/30 mt-0.5" />
      <div>
        <p className="text-xs text-white/40">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  )
}
