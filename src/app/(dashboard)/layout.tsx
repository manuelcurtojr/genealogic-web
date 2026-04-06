import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // For unauthenticated users (public pages like dog detail, kennel profile)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <header className="sticky top-0 z-50 flex items-center gap-4 px-6 py-2.5 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm">
          <a href="/" className="flex-shrink-0">
            <img src="/logo.svg" alt="Genealogic" className="h-6" />
          </a>
          <div className="flex-1 max-w-xl mx-auto">
            <input type="text" placeholder="Buscar perros, razas o criaderos..." readOnly onClick={() => window.location.href = '/'}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 cursor-pointer hover:border-white/20 transition" />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a href="/login" className="px-4 py-2 rounded-lg border border-white/20 text-sm font-medium text-white/80 hover:bg-white/5 transition">
              Iniciar sesion
            </a>
            <a href="/register" className="px-4 py-2 rounded-lg bg-[#D74709] hover:bg-[#c03d07] text-sm font-semibold text-white transition">
              Registrarse
            </a>
          </div>
        </header>
        <main>
          {children}
        </main>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, role, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('name, logo_url')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0] || null

  return (
    <DashboardShell user={profile} kennel={kennel}>
      {children}
    </DashboardShell>
  )
}
