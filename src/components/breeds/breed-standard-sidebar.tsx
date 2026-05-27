'use client'

/**
 * BreedStandardSidebar — menú lateral persistente para el estándar de raza.
 *
 * Estilo idéntico al LegalSidebar: secciones fijas (las 12 del estándar
 * Genealogic) + indicador de sección activa por scroll-spy básico.
 *
 * Los enlaces son anchors (#info-general, #apariencia…) que apuntan al
 * mismo documento. Mobile: colapsa como nav horizontal arriba.
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Info, Eye, Ruler, Heart, Smile, ArrowDownToDot,
  Anchor, Footprints, Activity, Palette, Scale, AlertTriangle,
  Sparkles, GitCompare,
} from 'lucide-react'

export const BREED_SECTIONS = [
  { id: 'info-general',        label: 'Información general', icon: Info },
  { id: 'apariencia',          label: 'Apariencia general', icon: Eye },
  { id: 'proporciones',        label: 'Proporciones',        icon: Ruler },
  { id: 'temperamento',        label: 'Temperamento',        icon: Heart },
  { id: 'cabeza',              label: 'Cabeza',              icon: Smile },
  { id: 'cuello-cuerpo',       label: 'Cuello y cuerpo',     icon: ArrowDownToDot },
  { id: 'cola',                label: 'Cola',                icon: Anchor },
  { id: 'extremidades',        label: 'Extremidades',        icon: Footprints },
  { id: 'movimiento',          label: 'Movimiento',          icon: Activity },
  { id: 'manto',               label: 'Manto y color',       icon: Palette },
  { id: 'tamano-peso',         label: 'Tamaño y peso',       icon: Scale },
  { id: 'faltas',              label: 'Faltas',              icon: AlertTriangle },
  { id: 'reinterpretacion',    label: 'Sobre este estándar', icon: Sparkles },
  { id: 'diferencias-clubes',  label: 'Diferencias entre clubes', icon: GitCompare },
] as const

export type BreedSectionId = typeof BREED_SECTIONS[number]['id']

interface Props {
  breedName: string
  origin?: string | null
  fciNumber?: string | null
}

export default function BreedStandardSidebar({ breedName, origin, fciNumber }: Props) {
  const [activeId, setActiveId] = useState<string>('info-general')

  // Scroll-spy: marca la sección visible más arriba en el viewport
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sections = BREED_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({ id: e.target.id, top: e.boundingClientRect.top }))
          .sort((a, b) => a.top - b.top)
        if (visible.length > 0) setActiveId(visible[0].id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label="Secciones del estándar de raza" className="lg:sticky lg:top-8 space-y-6">
      {/* Encabezado del menú */}
      <div className="px-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          Estándar Genealogic
        </p>
        <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-ink">
          {breedName}
        </h2>
        <p className="mt-1 text-[12px] leading-snug text-muted">
          {origin || ''}
          {origin && fciNumber && ' · '}
          {fciNumber && `FCI nº ${fciNumber}`}
        </p>
      </div>

      {/* Lista de secciones */}
      <ul className="space-y-0.5">
        {BREED_SECTIONS.map((s) => {
          const active = activeId === s.id
          const Icon = s.icon
          return (
            <li key={s.id}>
              <Link
                href={`#${s.id}`}
                aria-current={active ? 'true' : undefined}
                className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all ${
                  active
                    ? 'bg-ink text-on-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                    : 'text-body hover:bg-surface-soft hover:text-ink'
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute -left-3 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-ink"
                  />
                )}
                <Icon
                  className={`h-3.5 w-3.5 flex-shrink-0 ${
                    active ? 'text-on-primary' : 'text-muted group-hover:text-ink'
                  }`}
                />
                <span
                  className={`text-[13px] font-medium leading-tight ${
                    active ? 'text-on-primary' : 'text-ink'
                  }`}
                >
                  {s.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Disclaimer compacto */}
      <div className="mx-3 rounded-xl border border-hairline bg-surface-soft/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          ¿Estándar oficial?
        </p>
        <p className="mt-2 text-[12px] leading-snug text-body">
          Este texto es una reinterpretación de las fuentes oficiales. Para uso
          oficial (jueces, expositores) consulta el PDF de la FCI o tu club nacional.
        </p>
      </div>
    </nav>
  )
}
