'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronRight, ChevronLeft, LayoutDashboard, Dog, Baby, GitCompareArrows,
  Heart, Calendar, KanbanSquare, Store, Mail, Settings,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

/**
 * Mini-sidebar flotante para el OWNER del kennel cuya web custom está viendo.
 *
 * Detección de "soy owner" en 3 capas (prevalece la primera que matche):
 *   1. `serverIsOwner` desde props (cookie de Supabase en el host actual)
 *   2. URL query `?owner=1` cuando el owner entra desde el dashboard
 *      → guardamos un flag en sessionStorage para que persista en la sesión
 *   3. sessionStorage `owner-preview-kennel` previamente guardado
 *
 * Las capas 2 y 3 son necesarias para que el menú salga también en
 * custom domains (iremacurto.com), donde la cookie de Supabase está
 * en .genealogic.io y NO está disponible. El acceso a las acciones
 * reales sigue requiriendo sesión válida (las acciones viven en
 * genealogic.io). Esto es solo UX visual + atajo de navegación.
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

export default function OwnerFloatingNav({
  serverIsOwner = false,
  kennelSlug,
}: {
  serverIsOwner?: boolean
  kennelSlug?: string
}) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  // Detecta owner por query/sessionStorage. Empieza false en SSR.
  const [clientIsOwner, setClientIsOwner] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('owner-floating-nav-expanded')
    if (saved === 'true') setExpanded(true)

    // ── Detección owner por query param (?owner=1) o sessionStorage ──
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('owner') === '1'
    const storageKey = `owner-preview-${kennelSlug ?? ''}`
    const fromStorage = sessionStorage.getItem(storageKey) === '1'
    if (fromQuery) {
      sessionStorage.setItem(storageKey, '1')
      setClientIsOwner(true)
      // Limpia el query param de la URL para que no sea bookmark-able
      params.delete('owner')
      const newQs = params.toString()
      const newUrl = window.location.pathname + (newQs ? `?${newQs}` : '') + window.location.hash
      window.history.replaceState({}, '', newUrl)
    } else if (fromStorage) {
      setClientIsOwner(true)
    }
  }, [kennelSlug])

  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem('owner-floating-nav-expanded', String(next))
  }

  // Renderizar solo si alguna de las 2 capas matchea
  if (!serverIsOwner && !clientIsOwner) return null

  // Si el owner solo fue detectado client-side (custom domain), apuntamos
  // los links absolutos a genealogic.io para que abran el dashboard real.
  const baseUrl = (!serverIsOwner && clientIsOwner) ? 'https://genealogic.io' : ''

  return (
    <div className="fixed left-4 top-4 z-50 hidden lg:block">
      {expanded ? (
        <div className="flex flex-col gap-1 rounded-2xl bg-canvas/95 backdrop-blur-md p-2 shadow-lg ring-1 ring-black/10 max-h-[calc(100vh-2rem)] overflow-y-auto">
          {/* Header con toggle */}
          <div className="flex items-center justify-between gap-2 px-2 pb-1.5">
            <Link
              href={`${baseUrl}/dashboard`}
              target={baseUrl ? '_blank' : undefined}
              className="flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.02em] text-ink"
            >
              <span className="font-display">Genealogic</span>
            </Link>
            <button
              onClick={toggle}
              className="rounded-md p-1 text-muted hover:bg-surface-soft hover:text-ink"
              title={t('Plegar')}
              aria-label={t('Plegar menú')}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
            {t('Tu vista de criador')}
          </p>

          {/* Items */}
          {ITEMS.map((it) => {
            const Icon = it.icon
            return (
              <Link
                key={it.href}
                href={`${baseUrl}${it.href}`}
                target={baseUrl ? '_blank' : undefined}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
              >
                <Icon className="h-3.5 w-3.5 text-muted" />
                {t(it.label)}
              </Link>
            )
          })}

          <div className="mt-1 border-t border-hairline-soft px-2 pt-2">
            <p className="text-[10.5px] text-muted leading-tight">
              {baseUrl
                ? t('Estás viendo tu web pública en tu dominio. Los enlaces abren tu dashboard en genealogic.io en una pestaña nueva.')
                : t('Estás viendo tu web pública. Solo tú ves este menú porque estás logueado como propietario.')}
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={toggle}
          className="group flex h-10 w-10 items-center justify-center rounded-full bg-canvas/95 backdrop-blur-md shadow-lg ring-1 ring-black/10 transition-all hover:bg-canvas hover:shadow-xl"
          title={t('Abrir menú de criador')}
          aria-label={t('Abrir menú de criador')}
        >
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">G</span>
          <ChevronRight className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-canvas text-muted opacity-0 shadow ring-1 ring-black/5 transition-opacity group-hover:opacity-100" />
        </button>
      )}
    </div>
  )
}
