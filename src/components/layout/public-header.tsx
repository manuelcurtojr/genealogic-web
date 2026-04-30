'use client'

import { useEffect } from 'react'
import { User } from 'lucide-react'
import SearchBar from './search-bar'
import { Wordmark } from '@/components/ui/wordmark'
import { Button } from '@/components/ui/button'

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
        <Wordmark size="text-lg" />
        <div className="flex-1 min-w-0">
          <SearchBar />
        </div>
        <a href="/login" className="w-10 h-10 rounded-full bg-chip border border-hair-strong flex items-center justify-center text-fg hover:bg-chip transition shrink-0">
          <User className="w-5 h-5" />
        </a>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex items-center gap-3 px-4 py-2">
        <Wordmark size="text-xl" className="mr-2" />
        <div className="flex-1">
          <SearchBar />
        </div>
        <Button href="/login" variant="secondary" size="sm">Iniciar sesión</Button>
        <Button href="/register" variant="primary" size="sm">Registrarse</Button>
      </div>
    </header>
  )
}
