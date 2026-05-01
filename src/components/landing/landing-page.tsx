'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sun, Moon, ArrowDown } from 'lucide-react'
import SearchBar from '@/components/layout/search-bar'
import { NebulaBg } from '@/components/ui/nebula-bg'
import { SectionLabel } from '@/components/ui/section-label'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'

interface Props {
  breeds: { id: string; name: string }[]
  featuredDogs: any[]
}

export default function LandingPage({ breeds, featuredDogs }: Props) {
  const [darkMode, setDarkMode] = useState(true)
  const breedThumbs = featuredDogs.slice(0, 6)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      setDarkMode(false)
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  return (
    <main className="min-h-screen bg-ink-900 text-fg">
      {/* ── Header (no logo on home — wordmark is the hero) ────────── */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-[60px] max-w-page items-center justify-end px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-[10px]">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-hair-strong text-fg-mute transition hover:text-fg"
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <Button href="/login" variant="secondary" size="sm" className="hidden sm:inline-flex">
              Iniciar sesión
            </Button>
            <Button href="/register" variant="primary" size="sm">
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero search (Google-style, full screen) ──────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
        <NebulaBg />
        <div className="relative z-10 w-full max-w-2xl text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute">
            Genealogías verificables
          </p>
          <Link
            href="/"
            className="mb-2 inline-block font-sans text-5xl font-bold leading-[0.95] tracking-[-0.025em] text-fg transition hover:opacity-90 sm:text-6xl md:text-7xl"
          >
            Genealogic
          </Link>
          <p className="mb-8 font-display text-xl italic font-light text-fg-dim sm:text-2xl">
            el registro público de perros con genealogía
          </p>

          {/* Search bar — protagonist */}
          <div className="mx-auto w-full max-w-xl">
            <SearchBar />
          </div>

          {/* Featured dogs row */}
          {breedThumbs.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {breedThumbs.map((dog: any) => (
                <Link
                  key={dog.id}
                  href={`/dogs/${dog.slug || dog.id}`}
                  className="block h-10 w-10 overflow-hidden rounded-lg border border-hair bg-chip transition hover:border-paper-50/40 hover:scale-105"
                  title={dog.name}
                >
                  {dog.thumbnail_url && (
                    <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover" />
                  )}
                </Link>
              ))}
              <Link
                href="/search"
                className="flex h-10 items-center rounded-lg border border-hair-strong px-3 text-xs font-medium text-fg-dim transition hover:text-fg hover:border-paper-50/40"
              >
                Ver todos →
              </Link>
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <a
          href="#mas-info"
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 text-fg-mute transition hover:text-fg"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Más info</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* ── ¿Qué es? — 3 pillars ────────────────────────────────────── */}
      <section id="mas-info" className="border-t border-hair py-20 sm:py-24">
        <div className="mx-auto max-w-page px-6 sm:px-8 lg:px-12">
          <SectionLabel num="01" label="QUÉ ES" className="mb-6" />
          <h2 className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-4xl md:text-5xl max-w-[24ch]">
            Tres capas. <span className="italic font-light">Una sola red.</span>
          </h2>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-fg-dim">
            El registro público mundial de genealogías caninas. Cada criador serio tiene su
            escaparate. Cada perro su árbol genealógico verificable.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
            <Pillar
              num="I"
              title="Datos"
              desc="Cada perro con su árbol genealógico de 3-5 generaciones, fotos, datos sanitarios y registro verificable."
            />
            <Pillar
              num="II"
              title="Identidad"
              desc="Cada criadero con perfil público profesional. Afijo en el nombre de los perros, branding propio, página indexable."
            />
            <Pillar
              num="III"
              title="Red"
              desc="Que un comprador busque «Galgo Italiano» y encuentre criadores reales con sus perros, sus camadas y su trayectoria."
            />
          </div>
        </div>
      </section>

      {/* ── Para criadores ──────────────────────────────────────────── */}
      <section className="border-t border-hair py-20 sm:py-24">
        <div className="mx-auto max-w-page px-6 sm:px-8 lg:px-12">
          <SectionLabel num="02" label="PARA CRIADORES" className="mb-6" />
          <h2 className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-4xl md:text-5xl max-w-[20ch]">
            Sube tu catálogo en una tarde.{' '}
            <span className="italic font-light">Que el mundo encuentre tus perros.</span>
          </h2>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-fg-dim">
            Registra tus perros, importa genealogías existentes con OCR de IA, crea perfil
            público de tu criadero. Gratis. Conecta con Pawdoq Breeders cuando quieras
            automatizar la conversión.
          </p>
          <div className="mt-10 flex flex-wrap gap-[10px]">
            <Button href="/register" variant="primary">
              Empezar →
            </Button>
            <Button href="/api-docs" variant="secondary">
              Ver API
            </Button>
          </div>
        </div>
      </section>

      {/* ── Para compradores ────────────────────────────────────────── */}
      <section className="border-t border-hair py-20 sm:py-24">
        <div className="mx-auto max-w-page px-6 sm:px-8 lg:px-12">
          <SectionLabel num="03" label="PARA COMPRADORES" className="mb-6" />
          <h2 className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-4xl md:text-5xl max-w-[22ch]">
            Encuentra perros con genealogía real.{' '}
            <span className="italic font-light">No fotos en Wallapop.</span>
          </h2>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-fg-dim">
            Busca por raza, criadero o linaje. Mira el árbol genealógico, las camadas
            previas, los logros. Contacta directamente al criador.
          </p>
          <div className="mt-10 flex flex-wrap gap-[10px]">
            <Button href="/search" variant="primary">
              Buscar perros →
            </Button>
            <Button href="/kennels" variant="secondary">
              Ver criaderos
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-hair py-10 sm:py-12">
        <div className="mx-auto max-w-page px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Wordmark size="text-lg" />
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute">
                Diseñado e integrado por{' '}
                <a
                  href="https://pawdoq.com"
                  target="_blank"
                  rel="noopener"
                  className="underline decoration-fg-mute underline-offset-[3px] transition hover:text-fg hover:decoration-fg"
                >
                  Pawdoq
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-fg-dim">
              <Link href="/login" className="transition hover:text-fg">Iniciar sesión</Link>
              <Link href="/register" className="transition hover:text-fg">Registrarse</Link>
              <Link href="/api-docs" className="transition hover:text-fg">API</Link>
              <Link href="/legal" className="transition hover:text-fg">Legal</Link>
              <Link href="/privacy" className="transition hover:text-fg">Privacidad</Link>
              <Link href="/terms" className="transition hover:text-fg">Términos</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

function Pillar({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div>
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute">{num}</span>
      <h3 className="mt-3 font-display text-[28px] font-normal leading-[1.1] tracking-[-0.015em] text-fg">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-[1.55] text-fg-dim">{desc}</p>
    </div>
  )
}
