/**
 * Variante de OnboardingCard para PROPIETARIOS (sin kennel).
 *
 * Misma UX que la card del criador pero:
 *  - Copy adaptado ("Tus perros, listos en 5 min" en lugar de "Pon tu
 *    criadero a funcionar")
 *  - storageKey basada en userId (no kennelId)
 *  - ICON_MAP extendido con Calendar, FileText, Stethoscope
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Dog, Image as ImageIcon, FileText, Calendar, Stethoscope,
  Check, ChevronDown, ChevronUp, X, PartyPopper, ArrowRight,
} from 'lucide-react'
import type { OnboardingStatus, OnboardingStep } from '@/lib/onboarding/types'
import { useT } from '@/components/i18n/locale-provider'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Dog, Image: ImageIcon, FileText, Calendar, Stethoscope,
}

export default function OnboardingCardOwner({
  userId,
  status,
}: {
  userId: string
  status: OnboardingStatus
}) {
  const t = useT()
  const dismissKey = `onboarding-owner-${userId}-dismissed`
  const collapseKey = `onboarding-owner-${userId}-collapsed`

  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(dismissKey) === '1') setDismissed(true)
    if (localStorage.getItem(collapseKey) === '1') setCollapsed(true)
    setHydrated(true)
  }, [dismissKey, collapseKey])

  function handleDismiss() {
    localStorage.setItem(dismissKey, '1')
    setDismissed(true)
  }
  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(collapseKey, next ? '1' : '0')
  }

  if (!hydrated) return null
  if (dismissed) return null
  if (status.steps.length === 0) return null

  if (status.allComplete) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 flex items-center gap-4">
        <PartyPopper className="w-6 h-6 text-emerald-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-900">{t('¡Tus perros están al día!')}</p>
          <p className="text-xs text-emerald-800 mt-0.5">
            {t('Completaste los')} {status.totalCount} {t('pasos. Genealogic te avisará de vacunas y novedades de tus criaderos.')}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
        >
          {t('Cerrar')}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-canvas overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-ink" />
            <p className="text-sm font-bold text-ink">{t('Tus perros, listos en 5 minutos')}</p>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-ink text-on-primary rounded-full px-2 py-0.5 tabular-nums">
              {status.completedCount}/{status.totalCount}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-card overflow-hidden">
            <div
              className="h-full bg-ink transition-all duration-300"
              style={{ width: `${status.progressPct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-soft"
            title={collapsed ? t('Expandir') : t('Colapsar')}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-soft"
            title={t('Ocultar (no volver a mostrar)')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <ul className="divide-y divide-hairline-soft">
          {status.steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ul>
      )}

      {collapsed && (
        <p className="px-5 py-3 text-[11px] text-muted text-center">
          {status.completedCount === 0
            ? t('Pulsa la flecha de arriba para ver los pasos pendientes.')
            : `${status.totalCount - status.completedCount} ${t('pasos pendientes — pulsa la flecha para verlos.')}`}
        </p>
      )}
    </div>
  )
}

function StepRow({ step }: { step: OnboardingStep }) {
  const t = useT()
  const Icon = ICON_MAP[step.icon] || Sparkles

  return (
    <li
      className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${
        step.done ? 'opacity-60' : 'hover:bg-surface-soft'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {step.done ? (
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-3 h-3 text-emerald-700" strokeWidth={3} />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-hairline" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Icon className={`w-3.5 h-3.5 ${step.done ? 'text-muted' : 'text-ink'}`} />
          <p
            className={`text-sm font-semibold ${
              step.done ? 'text-muted line-through' : 'text-ink'
            }`}
          >
            {step.label}
          </p>
          {step.importance === 'recommended' && !step.done && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              {t('Recomendado')}
            </span>
          )}
          {step.importance === 'optional' && !step.done && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-surface-card px-1.5 py-0.5 rounded">
              {t('Opcional')}
            </span>
          )}
        </div>
        {!step.done && (
          <p className="text-[12.5px] text-muted mt-0.5 leading-snug">{step.description}</p>
        )}
      </div>

      {!step.done && (
        <Link
          href={step.href}
          className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg bg-ink text-on-primary px-3 py-1.5 text-xs font-semibold hover:opacity-90"
        >
          {step.ctaLabel}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </li>
  )
}
