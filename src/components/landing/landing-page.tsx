'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import SearchBar from '@/components/layout/search-bar'

interface Props {
  breeds: { id: string; name: string }[]
  featuredDogs: any[]
}

export default function LandingPage({ breeds, featuredDogs }: Props) {
  const [darkMode, setDarkMode] = useState(true)
  const breedThumbs = featuredDogs.slice(0, 5)

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white relative overflow-hidden">
      {/* Animated nebula background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Nebula orbs */}
        <div className="absolute w-[800px] h-[800px] rounded-full opacity-[0.07] blur-[120px] animate-[nebula1_20s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, #D74709 0%, transparent 70%)', top: '-20%', left: '-10%' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.05] blur-[100px] animate-[nebula2_25s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, #1a56db 0%, transparent 70%)', top: '30%', right: '-15%' }} />
        <div className="absolute w-[700px] h-[700px] rounded-full opacity-[0.04] blur-[130px] animate-[nebula3_30s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)', bottom: '-20%', left: '20%' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[90px] animate-[nebula4_22s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, #D74709 0%, transparent 70%)', top: '50%', left: '50%' }} />

        {/* Floating particles */}
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i}
            className="absolute rounded-full bg-white animate-[float_var(--dur)_ease-in-out_infinite]"
            style={{
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 23 + 7) % 100}%`,
              opacity: 0.1 + (i % 5) * 0.08,
              '--dur': `${8 + (i % 7) * 3}s`,
              animationDelay: `${i * 0.5}s`,
            } as any}
          />
        ))}

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
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
        <div className="w-full max-w-2xl">
          <SearchBar />
        </div>

        {/* Featured dogs */}
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

      {/* Keyframes as inline style */}
      <style jsx>{`
        @keyframes nebula1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(100px, 50px) scale(1.1); }
          66% { transform: translate(-50px, 100px) scale(0.9); }
        }
        @keyframes nebula2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-80px, 60px) scale(1.15); }
          66% { transform: translate(60px, -40px) scale(0.85); }
        }
        @keyframes nebula3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(70px, -80px) scale(1.1); }
          66% { transform: translate(-100px, 30px) scale(0.95); }
        }
        @keyframes nebula4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.06; }
          50% { transform: translate(-60px, 40px) scale(1.2); opacity: 0.03; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}
