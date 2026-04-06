'use client'

import { useState } from 'react'
import { Menu, PawPrint } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import Sidebar from './sidebar'

interface DashboardShellProps {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  kennel: { name: string; logo_url: string | null } | null
  children: React.ReactNode
}

export default function DashboardShell({ user, kennel, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar user={user} kennel={kennel} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-950 border-b border-white/10 flex items-center px-4 z-30">
        <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white transition mr-3">
          <Menu className="w-6 h-6" />
        </button>
        <PawPrint className="w-5 h-5" style={{ color: BRAND.primary }} />
        <span className="text-sm font-bold text-white ml-2">Genealogic</span>
        <div className="ml-auto">
          <div className="w-8 h-8 rounded-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xs font-bold">
            {(user?.display_name || '?')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="lg:ml-64 p-4 pt-18 lg:p-8 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
