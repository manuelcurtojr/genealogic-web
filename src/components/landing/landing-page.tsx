'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import SearchBar from '@/components/layout/search-bar'
import { NebulaBg } from '@/components/ui/nebula-bg'
import { SectionLabel } from '@/components/ui/section-label'
import { Button } from '@/components/ui/button'

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
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-hair backdrop-blur-xl"
        style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 85%, transparent)' }}
      >
        <div className="mx-auto flex h-[60px] max-w-page items-center justify-between px-6 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center">
            <span className="font-sans text-[17px] font-bold tracking-[-0.02em] text-fg">
              Genealogic
            </span>
          </Link>
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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-hair pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-[88px] lg:pt-[88px]">
        <NebulaBg />
        <div className="relative z-10 mx-auto max-w-page px-6 sm:px-8 lg:px-12">
          <SectionLabel num="01" label="EL REGISTRO" className="mb-8" />
          <h1 className="font-display text-5xl font-normal leading-[0.95] tracking-[-0.035em] sm:text-6xl md:text-7xl lg:text-[88px] lg:tracking-[-3px] max-w-[12ch]">
            Pedigrees
            <br />
            <span className="italic font-light">verificables</span>
            <br />
            de cualquier
            <br />
            criador.
          </h1>
          <p className="mt-8 max-w-[560px] text-[19px] leading-[1.5] tracking-[-0.1px] text-fg-dim">
            El registro público de perros con pedigree del mundo. Cada criador serio tiene
            su escaparate. Cada perro su árbol genealógico verificable. Indexado en Google,
            consultable por API.
          </p>
          <div className="mt-10 flex flex-wrap gap-[10px]">
            <Button href="/register" variant="primary">
              Crear cuenta gratis →
            </Button>
            <Button href="/search" variant="secondary">
              Buscar perros y criaderos
            </Button>
          </div>

          {/* Featured dogs row */}
          {breedThumbs.length > 0 && (
            <div className="mt-14 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute">
                Recién registrados
              </span>
              <div className="flex items-center gap-2">
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
            </div>
          )}
        </div>
      </section>

      {/* ── Search section ───────────────────────────────────────────── */}
      <section className="border-b border-hair py-16 sm:py-20">
        <div className="mx-auto max-w-page px-6 sm:px-8 lg:px-12">
          <SectionLabel num="02" label="BUSCAR" className="mb-6" />
          <h2 className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-4xl max-w-[20ch]">
            Encuentra el perro o criadero <span className="italic font-light">que buscas.</span>
          </h2>
          <div className="mt-8 max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ── Three pillars ────────────────────────────────────────────── */}
      <section className="border-b border-hair py-16 sm:py-20">
        <div className="mx-auto max-w-page px-6 sm:px-8 lg:px-12">
          <SectionLabel num="03" label="QUÉ ES" className="mb-6" />
          <h2 className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-4xl max-w-[24ch]">
            Tres capas. <span className="italic font-light">Una sola red.</span>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Pillar
              num="I"
              title="Datos"
              desc="Cada perro registrado con genealogía 3-5 generaciones, fotos, datos sanitarios y pedigree verificable."
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

      {/* ── For breeders / API ──────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-hair py-20 sm:py-24">
        <div className="relative z-10 mx-auto max-w-page px-6 sm:px-8 lg:px-12">
          <SectionLabel num="04" label="PARA CRIADORES" className="mb-6" />
          <h2 className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-4xl md:text-5xl max-w-[20ch]">
            Sube tu catálogo en una tarde.{' '}
            <span className="italic font-light">Que el mundo encuentre tus perros.</span>
          </h2>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-fg-dim">
            Registra todos tus perros, importa pedigrees existentes con OCR de IA,
            crea perfil público de tu criadero. Gratis. Conecta con Pawdoq Breeders cuando
            quieras automatizar la conversión.
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

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-10 sm:py-12">
        <div className="mx-auto max-w-page px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-sans text-base font-bold tracking-[-0.02em] text-fg">Genealogic</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute">
                Manuel Curtó SL · genealogic.io
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
