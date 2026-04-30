'use client'

import { useEffect } from 'react'
import { User } from 'lucide-react'
import SearchBar from './search-bar'

export default function PublicHeader() {
  useEffect(() => {
    // Force dark mode for public pages
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-ink-900 border-b border-hair">
      {/* Mobile */}
      <div className="lg:hidden flex items-center gap-3 px-4 h-12">
        <a href="/" className="shrink-0">
          <img src="/icon.svg" alt="Genealogic" className="h-5 w-auto" />
        </a>
        <div className="flex-1 min-w-0">
          <SearchBar />
        </div>
        <a href="/login" className="w-10 h-10 rounded-full bg-chip border border-hair-strong flex items-center justify-center text-fg hover:bg-white/20 transition shrink-0">
          <User className="w-5 h-5" />
        </a>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex items-center gap-3 px-4 py-2">
        <a href="/" className="flex-shrink-0">
          <img src="/logo.svg" alt="Genealogic" className="h-6" />
        </a>
        <div className="flex-1">
          <SearchBar />
        </div>
        <a href="/login" className="px-4 py-2 rounded-lg border border-hair-strong text-white/80 hover:bg-chip text-sm font-medium transition flex-shrink-0">
          Iniciar sesion
        </a>
        <a href="/register" className="px-4 py-2 rounded-lg bg-[#D74709] hover:bg-[#c03d07] text-sm font-semibold text-white transition flex-shrink-0">
          Registrarse
        </a>
      </div>
    </header>
  )
}
