/**
 * PagesToggles — bloque en /kennel "Páginas de tu web".
 *
 * Diseñado para el owner. Lista:
 *  - 3 páginas base (Inicio, Nuestros perros, Contacto) — siempre activas,
 *    no clickables.
 *  - 4 páginas extra (Sobre nosotros, Galería, Instalaciones, Blog) — toggle
 *    real si el user es Kennel Pro o enterprise; "Próximamente" + mailto si
 *    no lo es todavía.
 *
 * Las páginas extra activadas con contenido vacío aparecen al public como
 * 404 — el toggle solo dispara la intención. Al owner le mostramos un badge
 * "Pendiente: añadir contenido" al lado del toggle on en ese caso, para
 * recordar qué falta antes de que se haga pública.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Lock, Loader2, Check, AlertCircle, Home as HomeIcon, Dog,
  HelpCircle, MessageSquare, BookOpen, Image as ImageIcon, Building2,
  User as UserIcon, ArrowRight,
} from 'lucide-react'
import { EXTRA_PAGES, PAGE_NAV_LABEL, isExtraPageEnabled, type ExtraPageId } from '@/lib/kennel/pro-web'
import { toggleKennelPageAction } from '@/lib/kennel/pages-actions'

const PAGE_ICON: Record<ExtraPageId, React.ElementType> = {
  sobre: UserIcon,
  galeria: ImageIcon,
  instalaciones: Building2,
  blog: BookOpen,
}

const PAGE_DESC: Record<ExtraPageId, string> = {
  sobre: 'Cuenta tu historia, filosofía de cría y qué os distingue. Texto largo.',
  galeria: 'Fotos generales del criadero, perros y eventos.',
  instalaciones: 'Tour visual de dónde viven, juegan y crecen tus perros.',
  blog: 'Notas, novedades y anuncios de camadas.',
}

const BASE_PAGES: { id: 'home' | 'perros' | 'contacto'; desc: string; icon: React.ElementType }[] = [
  { id: 'home',     desc: 'Landing con hero, perros destacados, FAQ y CTA.', icon: HomeIcon },
  { id: 'perros',   desc: 'Catálogo completo: reproductores, venta, camadas y producidos.', icon: Dog },
  { id: 'contacto', desc: 'Formulario y datos del criadero.', icon: MessageSquare },
]

interface ContentStatus {
  aboutOk: boolean       // about_md >= 50 chars
  galleryOk: boolean     // >= 3 fotos kind=gallery
  facilitiesOk: boolean  // >= 3 fotos kind=facilities
  blogOk: boolean        // >= 1 post published
}

interface Props {
  kennelId: string
  enabledPages: Record<string, unknown> | null
  /** True si el user puede activar páginas Pro (kennel_pro plan o enterprise). */
  canUsePro: boolean
  /** Estado del contenido — para mostrar badge "Pendiente" si activa pero vacía. */
  contentStatus: ContentStatus
}

export default function PagesToggles({ kennelId, enabledPages, canUsePro, contentStatus }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<ExtraPageId | null>(null)
  const [error, setError] = useState<string | null>(null)

  function flip(id: ExtraPageId, current: boolean) {
    setError(null)
    setBusyId(id)
    startTransition(async () => {
      try {
        await toggleKennelPageAction({ kennelId, page: id, enabled: !current })
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'error'
        if (msg === 'requires_kennel_pro') {
          setError('Esta página requiere Kennel Pro. Apúntate a la lista de espera.')
        } else {
          setError('No se pudo cambiar el estado. Inténtalo de nuevo.')
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  const hasContent = (id: ExtraPageId): boolean => {
    switch (id) {
      case 'sobre':         return contentStatus.aboutOk
      case 'galeria':       return contentStatus.galleryOk
      case 'instalaciones': return contentStatus.facilitiesOk
      case 'blog':          return contentStatus.blogOk
    }
  }

  // Mapeo página → URL del editor
  const editorHref: Record<ExtraPageId, string> = {
    sobre: '/kennel/contenido/sobre',
    galeria: '/kennel/contenido/galeria',
    instalaciones: '/kennel/contenido/instalaciones',
    blog: '/kennel/contenido/blog',
  }

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Páginas</p>
        <h2 className="mt-1 text-[18px] sm:text-[20px] font-semibold tracking-[-0.02em] text-ink">
          Páginas de tu web
        </h2>
        <p className="mt-1 text-[13px] text-body">
          Activa las que quieras tener. Solo se publican cuando añades contenido (pulsa "Editar" para añadirlo).
        </p>
      </div>

      {/* Base — siempre on */}
      <ul className="rounded-xl border border-hairline divide-y divide-hairline bg-surface-soft">
        {BASE_PAGES.map(p => {
          const Icon = p.icon
          return (
            <li key={p.id} className="flex items-start gap-3 p-3 sm:p-3.5">
              <Icon className="h-3.5 w-3.5 mt-1 text-muted flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-ink">{PAGE_NAV_LABEL[p.id]}</p>
                <p className="text-[12px] text-muted leading-snug">{p.desc}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                <Check className="h-2.5 w-2.5" />
                Siempre activa
              </span>
            </li>
          )
        })}
      </ul>

      {/* Divider Kennel Pro */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-hairline" />
        <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">Kennel Pro</span>
        <div className="flex-1 border-t border-hairline" />
      </div>

      {/* Extra — toggle real o "Próximamente" */}
      <ul className="rounded-xl border border-hairline divide-y divide-hairline">
        {EXTRA_PAGES.map(id => {
          const Icon = PAGE_ICON[id]
          const isEnabled = isExtraPageEnabled(enabledPages, id)
          const isBusy = busyId === id && pending
          const contentReady = hasContent(id)
          const showContentWarning = isEnabled && !contentReady && canUsePro

          return (
            <li key={id} className="flex items-start gap-3 p-3 sm:p-3.5">
              <Icon className="h-3.5 w-3.5 mt-1 text-muted flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13.5px] font-semibold text-ink">{PAGE_NAV_LABEL[id]}</p>
                  {showContentWarning && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider">
                      Pendiente: contenido
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-muted leading-snug">{PAGE_DESC[id]}</p>
              </div>
              {!canUsePro ? (
                <a
                  href="mailto:hola@genealogic.io?subject=Lista%20de%20espera%20Kennel%20Pro%20Founder"
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex-shrink-0 hover:bg-blue-200 transition"
                >
                  <Lock className="h-2.5 w-2.5" />
                  Próximamente
                </a>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={editorHref[id]}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted hover:text-ink transition"
                    title="Editar contenido"
                  >
                    Editar <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Toggle
                    enabled={isEnabled}
                    busy={isBusy}
                    onToggle={() => flip(id, isEnabled)}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* FAQ — vive en la home, no es página propia. Lo aclaramos. */}
      <p className="mt-3 text-[11.5px] text-muted leading-snug flex items-start gap-1.5">
        <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        La sección "Preguntas frecuentes" se renderiza dentro del Inicio
        cuando tienes entradas en la biblioteca del Emailbot — no es una
        página propia.
      </p>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

function Toggle({ enabled, busy, onToggle }: { enabled: boolean; busy: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition ${
        enabled ? 'bg-ink' : 'bg-hairline'
      } ${busy ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:opacity-90'}`}
      aria-pressed={enabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-canvas shadow transition ${
          enabled ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-3 w-3 animate-spin text-on-primary" />
        </span>
      )}
    </button>
  )
}
