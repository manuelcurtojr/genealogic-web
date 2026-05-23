'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronRight, ChevronLeft, LayoutDashboard, Dog, Baby, GitCompareArrows,
  Heart, Calendar, KanbanSquare, Store, Mail, Settings,
} from 'lucide-react'

/**
 * Mini-sidebar flotante que se renderiza SOLO si el visitante logueado
 * es el owner del kennel cuya web custom está viendo. Permite navegar
 * de vuelta al dashboard sin perder de vista cómo se ve la web.
 *
 * Por defecto está PLEGADO (solo icono "G" en esquina top-left).
 * Click → despliega panel con accesos rápidos. Persiste estado en
 * localStorage para que el criador lo mantenga abierto si prefiere.
 *
 * Diseño minimal para no interferir con el branding propio del criadero.
 */

const ITEMS = [
  { label: 'Escritorio', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Perros', href: '/dogs', icon: Dog },
  { label: 'Camadas', href: '/litters', icon: Baby },
  { label: 'Cruces', href: '/cruces', icon: GitCompareArrows },
  { label: 'Reproducción', href: '/reproduccion', icon: Heart },
  { label: 'Calendario', href: '/calendar', icon: Calendar },
  { label: 'Reservas', href: '/reservas', icon: KanbanSquare },
  { label: 'Mi criadero', href: '/kennel', icon: Store },
  { label: 'Emailbot', href: '/emailbot', icon: Mail },
  { label: 'Ajustes', href: '/settings', icon: Settings },
] as const

export default function OwnerFloatingNav() {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('owner-floating-nav-expanded')
    if (saved === 'true') setExpanded(true)
  }, [])

  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem('owner-floating-nav-expanded', String(next))
  }

  return (
    <div className="fixed left-4 top-4 z-50 hidden lg:block">
      {expanded ? (
        <div className="flex flex-col gap-1 rounded-2xl bg-canvas/95 backdrop-blur-md p-2 shadow-lg ring-1 ring-black/10 max-h-[calc(100vh-2rem)] overflow-y-auto">
          {/* Header con toggle */}
          <div className="flex items-center justify-between gap-2 px-2 pb-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.02em] text-ink"
            >
              <span className="font-display">Genealogic</span>
            </Link>
            <button
              onClick={toggle}
              className="rounded-md p-1 text-muted hover:bg-surface-soft hover:text-ink"
              title="Plegar"
              aria-label="Plegar menú"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            Tu vista de criador
          </p>

          {/* Items */}
          {ITEMS.map((it) => {
            const Icon = it.icon
            return (
              <Link
                key={it.href}
                href={it.href}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
              >
                <Icon className="h-3.5 w-3.5 text-muted" />
                {it.label}
              </Link>
            )
          })}

          <div className="mt-1 border-t border-hairline-soft px-2 pt-2">
            <p className="text-[10.5px] text-muted leading-tight">
              Estás viendo tu web pública. Solo tú ves este menú porque estás logueado como propietario.
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={toggle}
          className="group flex h-10 w-10 items-center justify-center rounded-full bg-canvas/95 backdrop-blur-md shadow-lg ring-1 ring-black/10 transition-all hover:bg-canvas hover:shadow-xl"
          title="Abrir menú de criador"
          aria-label="Abrir menú de criador"
        >
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">G</span>
          <ChevronRight className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-canvas text-muted opacity-0 shadow ring-1 ring-black/5 transition-opacity group-hover:opacity-100" />
        </button>
      )}
    </div>
  )
}
