'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import SearchBar from './search-bar'

export default function PublicHeader() {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      setDarkMode(false)
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2 border-b border-white/10 bg-[var(--background)]/95 backdrop-blur-sm">
      <a href="/" className="flex-shrink-0">
        <img src="/logo.svg" alt="Genealogic" className="h-6" />
      </a>

      <div className="flex-1">
        <SearchBar />
      </div>

      <button onClick={toggleTheme}
        className="w-9 h-9 rounded-full flex items-center justify-center text-yellow-400 hover:bg-white/5 transition flex-shrink-0">
        {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
      </button>

      <a href="/login" className="px-4 py-2 rounded-lg border border-white/20 text-sm font-medium hover:bg-white/5 transition flex-shrink-0">
        Iniciar sesion
      </a>
      <a href="/register" className="px-4 py-2 rounded-lg bg-[#D74709] hover:bg-[#c03d07] text-sm font-semibold text-white transition flex-shrink-0">
        Registrarse
      </a>
    </header>
  )
}
