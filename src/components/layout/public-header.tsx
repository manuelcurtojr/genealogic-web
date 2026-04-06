'use client'

import { useState, useEffect } from 'react'
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

  const borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const iconColor = darkMode ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-800'
  const loginStyle = darkMode
    ? 'border-white/20 text-white/80 hover:bg-white/5'
    : 'border-gray-300 text-gray-700 hover:bg-gray-100'

  return (
    <header
      className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2"
      style={{ backgroundColor: darkMode ? '#0a0a0a' : '#f8fafc', borderBottom: `1px solid ${borderColor}` }}
    >
      <a href="/" className="flex-shrink-0">
        <><img src="/logo.svg" alt="Genealogic" className="logo-dark h-6" /><img src="/logo-dark.svg" alt="Genealogic" className="logo-light h-6" /></>
      </a>

      <div className="flex-1">
        <SearchBar />
      </div>

      <button onClick={toggleTheme}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 ${darkMode ? 'text-yellow-400 hover:bg-white/5' : 'text-yellow-500 hover:bg-gray-100'}`}>
        {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
      </button>

      <a href="/login" className={`px-4 py-2 rounded-lg border text-sm font-medium transition flex-shrink-0 ${loginStyle}`}>
        Iniciar sesion
      </a>
      <a href="/register" className="px-4 py-2 rounded-lg bg-[#D74709] hover:bg-[#c03d07] text-sm font-semibold text-white transition flex-shrink-0">
        Registrarse
      </a>
    </header>
  )
}
