/**
 * SectionsToggles — bloque en /kennel "Secciones de tu perfil".
 *
 * Lista las secciones base (siempre on, no configurable) y las extras
 * (toggleable con gate Pro). Los toggles deshabilitados muestran badge
 * "Próximamente" y al click abren un mailto a la lista de espera.
 *
 * Cuando un toggle cambia, llamamos server action y refrescamos.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, Check, Trophy, BookOpen, HelpCircle, Image as ImageIcon, Building2, AlertCircle } from 'lucide-react'
import { SECTION_META, type SectionId, ALL_SECTION_IDS, isSectionEnabled } from '@/lib/kennel/sections'
import { toggleKennelSectionAction } from '@/lib/kennel/sections-actions'

const SECTION_ICON: Record<SectionId, React.ElementType> = {
  awards: Trophy,
  gallery: ImageIcon,
  facilities: Building2,
  blog: BookOpen,
  faq: HelpCircle,
}

const BASE_SECTIONS = [
  { label: 'Hero', desc: 'Logo, nombre, ubicación, estadísticas y CTAs principales.' },
  { label: 'Sobre el criadero', desc: 'Descripción larga, razas y redes sociales.' },
  { label: 'Nuestros perros', desc: 'Reproductores, en venta, camadas y producidos.' },
  { label: 'Contacto', desc: 'Formulario configurable y datos del criadero.' },
]

interface Props {
  kennelId: string
  enabledSections: Record<string, unknown> | null
  /** True si el user puede activar secciones Pro (enterprise + kennel_pro). */
  canUsePro: boolean
}

export default function SectionsToggles({ kennelId, enabledSections, canUsePro }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<SectionId | null>(null)
  const [error, setError] = useState<string | null>(null)

  function flip(id: SectionId, current: boolean) {
    setError(null)
    setBusyId(id)
    startTransition(async () => {
      try {
        await toggleKennelSectionAction({ kennelId, section: id, enabled: !current })
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'error'
        if (msg === 'requires_kennel_pro') {
          setError('Esta sección está en Kennel Pro. Apúntate a la lista de espera.')
        } else {
          setError('No se pudo cambiar el estado. Inténtalo de nuevo.')
        }
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Tu perfil público</p>
        <h2 className="mt-1 text-[18px] sm:text-[20px] font-semibold tracking-[-0.02em] text-ink">
          Secciones de tu perfil
        </h2>
        <p className="mt-1 text-[13px] text-body">
          Las activadas aparecen automáticamente en tu perfil público. Sin escribir HTML —
          se rellenan solas con los datos del criadero.
        </p>
      </div>

      {/* Secciones base (siempre on) */}
      <ul className="rounded-xl border border-hairline divide-y divide-hairline bg-surface-soft">
        {BASE_SECTIONS.map((s, i) => (
          <li key={i} className="flex items-start gap-3 p-3 sm:p-3.5">
            <Check className="h-3.5 w-3.5 mt-1 text-emerald-700 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-ink">{s.label}</p>
              <p className="text-[12px] text-muted leading-snug">{s.desc}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
              Siempre activa
            </span>
          </li>
        ))}
      </ul>

      {/* Divider con label "Kennel Pro" */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-hairline" />
        <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
          Kennel Pro
        </span>
        <div className="flex-1 border-t border-hairline" />
      </div>

      {/* Secciones extra (toggleables) */}
      <ul className="rounded-xl border border-hairline divide-y divide-hairline">
        {ALL_SECTION_IDS.map(id => {
          const meta = SECTION_META[id]
          const Icon = SECTION_ICON[id]
          const isEnabled = isSectionEnabled(enabledSections, id)
          const proLocked = meta.isPro && !canUsePro
          const isBusy = busyId === id && pending

          return (
            <li key={id} className="flex items-start gap-3 p-3 sm:p-3.5">
              <Icon className="h-3.5 w-3.5 mt-1 text-muted flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-ink">{meta.label}</p>
                <p className="text-[12px] text-muted leading-snug">{meta.description}</p>
              </div>
              {proLocked ? (
                <a
                  href="mailto:hola@genealogic.io?subject=Lista%20de%20espera%20Kennel%20Pro%20Founder"
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex-shrink-0 hover:bg-blue-200 transition"
                >
                  <Lock className="h-2.5 w-2.5" />
                  Próximamente
                </a>
              ) : (
                <Toggle
                  enabled={isEnabled}
                  busy={isBusy}
                  onToggle={() => flip(id, isEnabled)}
                />
              )}
            </li>
          )
        })}
      </ul>

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
