'use client'

import { User } from 'lucide-react'
import SearchBar from './search-bar'
import { Wordmark } from '@/components/ui/wordmark'
import { Button } from '@/components/ui/button'

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-hairline">
      {/* Mobile */}
      <div className="lg:hidden flex items-center gap-3 px-4 h-14">
        <Wordmark size="text-lg" />
        <div className="flex-1 min-w-0">
          <SearchBar />
        </div>
        <a
          href="/login"
          className="w-10 h-10 rounded-full bg-surface-card border border-hairline flex items-center justify-center text-ink hover:bg-hairline transition shrink-0"
        >
          <User className="w-5 h-5" />
        </a>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex items-center gap-3 px-6 py-3 max-w-[1200px] mx-auto">
        <Wordmark size="text-xl" className="mr-3" />
        <div className="flex-1">
          <SearchBar />
        </div>
        <Button href="/login" variant="ghost" size="sm">
          Iniciar sesión
        </Button>
        <Button href="/register" variant="primary" size="sm">
          Registrarse
        </Button>
      </div>
    </header>
  )
}
