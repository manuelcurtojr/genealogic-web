'use client'

import Link from 'next/link'
import { ArrowDown } from 'lucide-react'
import SearchBar from '@/components/layout/search-bar'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'

interface Props {
  breeds: { id: string; name: string }[]
  featuredDogs: any[]
}

export default function LandingPage({ breeds, featuredDogs }: Props) {
  const breedThumbs = featuredDogs.slice(0, 6)

  return (
    <main className="min-h-screen bg-white text-ink">
      {/* ── Header — Cal-style white nav, 64px ───────────────────────────── */}
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-12">
          <div className="flex items-center" />
          <div className="flex items-center gap-2">
            <Button href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Iniciar sesión
            </Button>
            <Button href="/register" variant="primary" size="sm">
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero search (Google-style on white) ──────────────────────────── */}
      <section className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4">
        <div className="relative z-10 w-full max-w-2xl text-center">
          <p className="mb-4 text-[13px] font-medium uppercase tracking-[1.2px] text-muted">
            Genealogías verificables
          </p>
          <span
            className="mb-3 inline-block font-sans font-semibold text-ink"
            style={{
              fontSize: 'clamp(48px, 9vw, 88px)',
              lineHeight: 1.02,
              letterSpacing: '-2.5px',
            }}
          >
            Genealogic
          </span>
          <p
            className="mb-10 text-[18px] text-body sm:text-xl"
            style={{ letterSpacing: '-0.2px' }}
          >
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
                  className="block h-10 w-10 overflow-hidden rounded-md border border-hairline bg-surface-card transition hover:border-ink/30 hover:scale-105"
                  title={dog.name}
                >
                  {dog.thumbnail_url && (
                    <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover" />
                  )}
                </Link>
              ))}
              <Link
                href="/search"
                className="flex h-10 items-center rounded-md border border-hairline px-3 text-xs font-medium text-body transition hover:text-ink hover:border-ink/30"
              >
                Ver todos →
              </Link>
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <a
          href="#mas-info"
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 text-muted transition hover:text-ink"
        >
          <span className="text-[11px] font-medium uppercase tracking-[1.2px]">Más info</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* ── 01 — Qué es: 3 pillars on light-gray cards ─────────────────── */}
      <section id="mas-info" className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[96px]">
          <p className="mb-3 text-[13px] font-medium uppercase tracking-[1.2px] text-muted">
            01 · Qué es
          </p>
          <h2
            className="max-w-[24ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-1.5px' }}
          >
            Tres capas. Una sola red.
          </h2>
          <p className="mt-6 max-w-[560px] text-[16px] leading-[1.5] text-body">
            El registro público mundial de genealogías caninas. Cada criador serio tiene su
            escaparate. Cada perro su árbol genealógico verificable.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
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

      {/* ── 02 — Para criadores ────────────────────────────────────────── */}
      <section className="border-t border-hairline bg-surface-soft">
        <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[96px]">
          <p className="mb-3 text-[13px] font-medium uppercase tracking-[1.2px] text-muted">
            02 · Para criadores
          </p>
          <h2
            className="max-w-[20ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-1.5px' }}
          >
            Sube tu catálogo en una tarde. Que el mundo encuentre tus perros.
          </h2>
          <p className="mt-6 max-w-[560px] text-[16px] leading-[1.5] text-body">
            Registra tus perros, importa genealogías existentes con OCR de IA, crea perfil
            público de tu criadero. Gratis. Conecta con Pawdoq Breeders cuando quieras
            automatizar la conversión.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            <Button href="/register" variant="primary">
              Empezar
            </Button>
            <Button href="/api-docs" variant="secondary">
              Ver API
            </Button>
          </div>
        </div>
      </section>

      {/* ── 03 — Para compradores ──────────────────────────────────────── */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-12 lg:py-[96px]">
          <p className="mb-3 text-[13px] font-medium uppercase tracking-[1.2px] text-muted">
            03 · Para compradores
          </p>
          <h2
            className="max-w-[22ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-1.5px' }}
          >
            Encuentra perros con genealogía real. No fotos en Wallapop.
          </h2>
          <p className="mt-6 max-w-[560px] text-[16px] leading-[1.5] text-body">
            Busca por raza, criadero o linaje. Mira el árbol genealógico, las camadas
            previas, los logros. Contacta directamente al criador.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            <Button href="/search" variant="primary">
              Buscar perros
            </Button>
            <Button href="/kennels" variant="secondary">
              Ver criaderos
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer — Cal-style dark ────────────────────────────────────── */}
      <footer className="bg-surface-dark text-on-dark">
        <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Wordmark size="text-xl" className="!text-white" asLink={false} />
              <p className="mt-2 text-[13px] font-medium uppercase tracking-[1.2px] text-on-dark-soft">
                Diseñado e integrado por Pawdoq
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-[14px] text-on-dark-soft">
              <Link href="/login" className="transition hover:text-white">Iniciar sesión</Link>
              <Link href="/register" className="transition hover:text-white">Registrarse</Link>
              <Link href="/api-docs" className="transition hover:text-white">API</Link>
              <Link href="/legal" className="transition hover:text-white">Legal</Link>
              <Link href="/privacy" className="transition hover:text-white">Privacidad</Link>
              <Link href="/terms" className="transition hover:text-white">Términos</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

function Pillar({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="rounded-[12px] bg-surface-card p-8">
      <span className="text-[13px] font-medium uppercase tracking-[1.2px] text-muted">{num}</span>
      <h3
        className="mt-3 font-semibold text-ink"
        style={{ fontSize: '22px', lineHeight: 1.3, letterSpacing: '-0.3px' }}
      >
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-[1.55] text-body">{desc}</p>
    </div>
  )
}
