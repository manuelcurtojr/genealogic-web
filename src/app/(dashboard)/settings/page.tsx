import { createClient } from '@/lib/supabase/server'
import { User, Mail, Shield } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const roleMap: Record<string, { label: string; color: string }> = {
    free: { label: 'Free', color: 'bg-white/10 text-white/60' },
    pro: { label: 'Pro', color: 'bg-[#D74709]/20 text-[#D74709]' },
    admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400' },
  }
  const roleBadge = roleMap[profile?.role || 'free']

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-8">Ajustes</h1>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        {/* Avatar & name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xl font-bold">
            {profile?.display_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{profile?.display_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-white/50">{profile?.email}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleBadge.color}`}>{roleBadge.label}</span>
            </div>
          </div>
        </div>

        <hr className="border-white/10" />

        {/* Info fields */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-white/30 mt-1" />
            <div>
              <p className="text-xs text-white/40">Nombre</p>
              <p className="text-sm text-white">{profile?.display_name || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-white/30 mt-1" />
            <div>
              <p className="text-xs text-white/40">Email</p>
              <p className="text-sm text-white">{profile?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-white/30 mt-1" />
            <div>
              <p className="text-xs text-white/40">Genes</p>
              <p className="text-sm text-white">{profile?.genes || 0} genes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
