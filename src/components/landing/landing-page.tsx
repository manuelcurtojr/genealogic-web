'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import SearchBar from '@/components/layout/search-bar'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

interface Props {
  breeds: { id: string; name: string }[]
  featuredDogs: any[]
}

export default function LandingPage({ breeds, featuredDogs }: Props) {
  const [darkMode, setDarkMode] = useState(true)
  const [particlesReady, setParticlesReady] = useState(false)
  const breedThumbs = featuredDogs.slice(0, 5)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      setDarkMode(false)
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setParticlesReady(true))
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  const particlesOptions = useMemo<any>(() => ({
    fullScreen: false,
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    particles: {
      number: { value: 80, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: darkMode ? ['#D74709', '#ffffff', '#1a56db', '#8B5CF6'] : ['#D74709', '#94a3b8', '#1a56db', '#8B5CF6'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.1, max: 0.5 },
        animation: { enable: true, speed: 0.5, startValue: 'random', sync: false },
      },
      size: {
        value: { min: 0.5, max: 2.5 },
        animation: { enable: true, speed: 1, startValue: 'random', sync: false },
      },
      move: {
        enable: true,
        speed: { min: 0.2, max: 0.8 },
        direction: 'none' as const,
        random: true,
        straight: false,
        outModes: { default: 'out' as const },
      },
      links: {
        enable: true,
        distance: 150,
        color: '#D74709',
        opacity: 0.06,
        width: 0.5,
      },
      twinkle: {
        particles: { enable: true, frequency: 0.03, opacity: darkMode ? 0.8 : 0.5, color: { value: '#D74709' } },
      },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'grab' },
      },
      modes: {
        grab: { distance: 200, links: { opacity: 0.15, color: '#D74709' } },
      },
    },
    detectRetina: true,
  }), [darkMode])

  return (
    <div className={`min-h-screen relative overflow-hidden ${darkMode ? 'bg-[#0a0f1a] text-white' : 'bg-[#f8fafc] text-gray-900'}`}>
      {/* Nebula gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] ${darkMode ? 'opacity-[0.08]' : 'opacity-[0.15]'}`}
          style={{ background: 'radial-gradient(circle, #D74709, transparent 70%)', top: '-10%', left: '10%', animation: 'drift1 25s ease-in-out infinite' }} />
        <div className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] ${darkMode ? 'opacity-[0.05]' : 'opacity-[0.1]'}`}
          style={{ background: 'radial-gradient(circle, #1a56db, transparent 70%)', top: '40%', right: '-5%', animation: 'drift2 30s ease-in-out infinite' }} />
        <div className={`absolute w-[550px] h-[550px] rounded-full blur-[110px] ${darkMode ? 'opacity-[0.04]' : 'opacity-[0.08]'}`}
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)', bottom: '-15%', left: '30%', animation: 'drift3 35s ease-in-out infinite' }} />
      </div>

      {/* Particles */}
      {particlesReady && (
        <Particles
          className="absolute inset-0 pointer-events-auto"
          options={particlesOptions as any}
        />
      )}

      {/* Header */}
      <header className={`relative z-10 flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-white/5' : 'border-gray-200'}`}>
        <Link href="/" className="flex items-center gap-2">
          <><img src="/logo.svg" alt="Genealogic" className="logo-dark h-7" /><img src="/logo-dark.svg" alt="Genealogic" className="logo-light h-7" /></>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition ${darkMode ? 'border-white/10 text-yellow-400 hover:bg-white/5' : 'border-gray-200 text-yellow-500 hover:bg-gray-100'}`}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link href="/login" className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition ${darkMode ? 'border-white/20 text-white hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
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
            <Link key={dog.id} href={`/dogs/${dog.slug || dog.id}`}
              className={`w-10 h-10 rounded-lg overflow-hidden border hover:border-[#D74709]/50 transition hover:scale-110 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
              {dog.thumbnail_url ? (
                <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">{dog.name?.[0]}</div>
              )}
            </Link>
          ))}
          <Link href="/search" className={`h-10 px-3 rounded-lg flex items-center justify-center border hover:border-[#D74709]/50 transition text-xs font-medium ${darkMode ? 'bg-white/5 border-white/10 text-white/40 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-700'}`}>
            Ver todos →
          </Link>
        </div>
      </main>

      <style jsx>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(80px, 40px) scale(1.1); }
          66% { transform: translate(-40px, 80px) scale(0.9); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-60px, 50px) scale(1.15); }
          66% { transform: translate(50px, -30px) scale(0.85); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -60px) scale(1.1); }
          66% { transform: translate(-80px, 20px) scale(0.95); }
        }
      `}</style>
    </div>
  )
}
