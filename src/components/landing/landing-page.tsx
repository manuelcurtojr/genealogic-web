'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Sun, Moon } from 'lucide-react'

interface Props {
  breeds: { id: string; name: string }[]
  featuredDogs: any[]
}

export default function LandingPage({ breeds, featuredDogs }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [darkMode, setDarkMode] = useState(true)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  // Get unique breed thumbnails
  const breedThumbs = featuredDogs.slice(0, 5)

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white relative overflow-hidden">
      {/* Constellation background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          {/* Dots */}
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={`${(i * 37 + 13) % 100}%`} cy={`${(i * 23 + 7) % 100}%`} r="1.5" fill="#D74709" opacity={0.3 + (i % 5) * 0.15} />
          ))}
          {/* Lines connecting some dots like a pedigree tree */}
          <line x1="30%" y1="20%" x2="50%" y2="35%" stroke="#D74709" strokeWidth="0.5" opacity="0.15" />
          <line x1="70%" y1="20%" x2="50%" y2="35%" stroke="#D74709" strokeWidth="0.5" opacity="0.15" />
          <line x1="50%" y1="35%" x2="50%" y2="55%" stroke="#D74709" strokeWidth="0.5" opacity="0.15" />
          <line x1="20%" y1="10%" x2="30%" y2="20%" stroke="#D74709" strokeWidth="0.5" opacity="0.12" />
          <line x1="40%" y1="10%" x2="30%" y2="20%" stroke="#D74709" strokeWidth="0.5" opacity="0.12" />
          <line x1="60%" y1="10%" x2="70%" y2="20%" stroke="#D74709" strokeWidth="0.5" opacity="0.12" />
          <line x1="80%" y1="10%" x2="70%" y2="20%" stroke="#D74709" strokeWidth="0.5" opacity="0.12" />
          <line x1="35%" y1="60%" x2="50%" y2="55%" stroke="#D74709" strokeWidth="0.5" opacity="0.1" />
          <line x1="65%" y1="60%" x2="50%" y2="55%" stroke="#D74709" strokeWidth="0.5" opacity="0.1" />
          <line x1="15%" y1="75%" x2="35%" y2="60%" stroke="#D74709" strokeWidth="0.5" opacity="0.08" />
          <line x1="85%" y1="75%" x2="65%" y2="60%" stroke="#D74709" strokeWidth="0.5" opacity="0.08" />
        </svg>
        {/* Gradient overlay at edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#D74709]/5 via-transparent to-[#D74709]/3" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Genealogic" className="h-7" />
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-yellow-400 hover:bg-white/5 transition"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link href="/login" className="px-5 py-2.5 rounded-lg border border-white/20 text-sm font-medium text-white hover:bg-white/5 transition">
            Iniciar sesion
          </Link>
          <Link href="/register" className="px-5 py-2.5 rounded-lg bg-[#D74709] hover:bg-[#c03d07] text-sm font-semibold text-white transition">
            Registrarse
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-70px)] px-4">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl">
          <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-white/20 transition">
            <div className="flex-1 flex items-center px-5">
              <Search className="w-5 h-5 text-white/30 mr-3 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar perros, razas o criaderos..."
                className="w-full bg-transparent py-4 text-white placeholder:text-white/30 focus:outline-none text-base"
              />
            </div>
            <button type="submit" className="px-8 py-4 text-sm font-semibold text-white/60 hover:text-white transition border-l border-white/10 hover:bg-white/5">
              Buscar
            </button>
          </div>
        </form>

        {/* Featured dogs / breed thumbnails */}
        <div className="flex items-center gap-3 mt-6">
          {breedThumbs.map(dog => (
            <Link key={dog.id} href={`/dogs/${dog.id}`}
              className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#D74709]/50 transition hover:scale-105">
              {dog.thumbnail_url ? (
                <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">{dog.name?.[0]}</div>
              )}
            </Link>
          ))}
          {featuredDogs.length > 5 && (
            <Link href="/kennels" className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:border-white/20 transition text-lg">
              ...
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
