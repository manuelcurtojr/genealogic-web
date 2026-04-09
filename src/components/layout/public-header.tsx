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
    <header className="sticky top-0 z-50 bg-gray-950 border-b border-white/10">
      {/* Mobile */}
      <div className="lg:hidden flex items-center gap-3 px-4 h-12">
        <a href="/" className="shrink-0">
          <img src="/icon.svg" alt="Genealogic" className="h-5 w-auto" />
        </a>
        <div className="flex-1 min-w-0">
          <SearchBar />
        </div>
        <a href="/login" className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 transition shrink-0">
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
        <a href="/login" className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/5 text-sm font-medium transition flex-shrink-0">
          Iniciar sesion
        </a>
        <a href="/register" className="px-4 py-2 rounded-lg bg-[#D74709] hover:bg-[#c03d07] text-sm font-semibold text-white transition flex-shrink-0">
          Registrarse
        </a>
      </div>
    </header>
  )
}
