'use client'

/**
 * Panel lateral de acciones del admin sobre un reporte de contenido.
 *
 * Acciones:
 *  - Cambiar status (open → reviewing → resuelto)
 *  - 3 botones de resolución:
 *     · Retirar contenido (resolved_removed)
 *     · Mantener contenido (resolved_kept)
 *     · Rechazar reporte (rejected)
 *     · Duplicado de otro reporte (duplicate_report)
 *  - Notas de resolución (obligatorias para resolver)
 *  - Acción tomada (texto libre — "Foto eliminada", "Criador anonimizado"...)
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, X, Loader2, AlertCircle, Trash2, Eye, FileX, Copy, EyeOff,
} from 'lucide-react'
import {
  type ReportStatus, type ReportReason,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  OPEN_STATUSES,
} from '@/lib/content-reports/types'
import type { HiddenReason } from '@/lib/moderation/types'

interface Props {
  report: {
    id: string
    status: ReportStatus
    reason: ReportReason
    target_type: string  // 'dog' | 'kennel' | 'photo' | ...
    target_id: string
    target_is_hidden?: boolean
    resolution_notes: string | null
    resolution_action: string | null
  }
}

/** Mapeo report reason → hidden reason (mismo enum salvo "other"). */
function reasonToHidden(reason: ReportReason): HiddenReason {
  // El enum es prácticamente idéntico, solo cambia el slug en algunos casos
  if (reason === 'personal_data') return 'rgpd_request'
  return reason as HiddenReason
}

export default function ReportAdminActions({ report }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [resolveMode, setResolveMode] = useState<
    'removed' | 'kept' | 'rejected' | 'duplicate' | null
  >(null)
  const [notes, setNotes] = useState(report.resolution_notes || '')
  const [action, setAction] = useState(report.resolution_action || '')

  // Si el target es perro/criadero y aún no está oculto, ofrecemos
  // ocultarlo automáticamente al resolver con "Retirar contenido"
  const canSoftHide =
    (report.target_type === 'dog' || report.target_type === 'kennel') &&
    !report.target_is_hidden
  const [alsoHide, setAlsoHide] = useState(canSoftHide)

  const isOpen = OPEN_STATUSES.includes(report.status)

  const RESOLVE_OPTIONS = {
    removed: {
      status: 'resolved_removed' as ReportStatus,
      title: 'Retirar contenido',
      desc: 'El contenido ha sido eliminado, anonimizado o restringido.',
      defaultAction: 'Contenido retirado',
      color: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      icon: Trash2,
    },
    kept: {
      status: 'resolved_kept' as ReportStatus,
      title: 'Mantener contenido',
      desc: 'Revisado y mantenido. Notificaremos al reportante.',
      defaultAction: 'Contenido mantenido tras revisión',
      color: 'bg-gray-50 border-gray-300 text-gray-900',
      icon: Eye,
    },
    rejected: {
      status: 'rejected' as ReportStatus,
      title: 'Rechazar reporte',
      desc: 'El reporte no tiene fundamento o es abusivo.',
      defaultAction: 'Reporte rechazado por infundado',
      color: 'bg-red-50 border-red-300 text-red-900',
      icon: FileX,
    },
    duplicate: {
      status: 'duplicate_report' as ReportStatus,
      title: 'Es duplicado',
      desc: 'Ya hay otro reporte sobre el mismo contenido.',
      defaultAction: 'Duplicado de otro reporte',
      color: 'bg-purple-50 border-purple-300 text-purple-900',
      icon: Copy,
    },
  }

  function changeStatus(status: ReportStatus) {
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/reports/${report.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'No se pudo actualizar')
        }
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function resolve() {
    setError('')
    if (!resolveMode) return
    if (!notes.trim()) {
      setError('Las notas de resolución son obligatorias')
      return
    }
    const cfg = RESOLVE_OPTIONS[resolveMode]
    startTransition(async () => {
      try {
        // Paso 1: si procede, ocultar el contenido en BBDD (soft-hide reversible)
        if (resolveMode === 'removed' && alsoHide && canSoftHide) {
          const hideRes = await fetch('/api/admin/moderate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetType: report.target_type,
              targetId: report.target_id,
              action: 'hide',
              reason: reasonToHidden(report.reason),
              notes: notes.trim(),
              reportId: report.id,
            }),
          })
          if (!hideRes.ok) {
            const data = await hideRes.json().catch(() => ({}))
            throw new Error(`No se pudo ocultar el contenido: ${data.error || hideRes.statusText}`)
          }
        }

        // Paso 2: marcar el reporte como resuelto
        const res = await fetch(`/api/admin/reports/${report.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: cfg.status,
            resolutionNotes: notes.trim(),
            resolutionAction: action.trim() || cfg.defaultAction,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'No se pudo resolver')
        }
        setResolveMode(null)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function reopen() {
    changeStatus('open')
  }

  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
        Acciones
      </p>

      {/* Estado actual */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] text-muted">Estado actual</span>
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${REPORT_STATUS_COLORS[report.status]}`}>
          {REPORT_STATUS_LABELS[report.status]}
        </span>
      </div>

      {/* Cambio rápido open → reviewing */}
      {report.status === 'open' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => changeStatus('reviewing')}
          className="w-full mb-3 inline-flex items-center justify-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm font-medium text-ink hover:bg-surface-soft disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Marcar en revisión
        </button>
      )}

      {/* Si está abierto / en revisión → mostrar botones de resolución */}
      {isOpen && (
        <>
          {!resolveMode && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mt-2">
                Resolver
              </p>
              {(Object.entries(RESOLVE_OPTIONS) as [keyof typeof RESOLVE_OPTIONS, typeof RESOLVE_OPTIONS[keyof typeof RESOLVE_OPTIONS]][]).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setResolveMode(key)
                      setAction(cfg.defaultAction)
                    }}
                    className={`w-full flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition hover:opacity-90 ${cfg.color}`}
                  >
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{cfg.title}</p>
                      <p className="text-[11px] opacity-80">{cfg.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {resolveMode && (
            <div className="space-y-3 rounded-lg border border-hairline bg-surface-soft p-3 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">
                  {RESOLVE_OPTIONS[resolveMode].title}
                </p>
                <button
                  type="button"
                  onClick={() => setResolveMode(null)}
                  className="text-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-body">
                  Acción tomada
                </label>
                <input
                  type="text"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="P. ej., Foto retirada / Criador anonimizado / Perfil oculto"
                  maxLength={200}
                  className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-body">
                  Notas de resolución <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Argumentación de la decisión (visible internamente, no se manda al reportante por defecto)"
                  rows={4}
                  maxLength={5000}
                  className="w-full resize-y rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                />
              </div>

              {/* Opción de ocultar automáticamente — solo aplica a "Retirar contenido"
                  cuando el target es dog/kennel y aún no está oculto */}
              {resolveMode === 'removed' && canSoftHide && (
                <label className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoHide}
                    onChange={(e) => setAlsoHide(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-ink"
                  />
                  <span className="text-[12px] text-amber-900 leading-snug">
                    <strong className="flex items-center gap-1.5">
                      <EyeOff className="h-3 w-3" />
                      Ocultar el {report.target_type === 'dog' ? 'perro' : 'criadero'} automáticamente
                    </strong>
                    <span className="block mt-0.5">
                      Soft-hide reversible: el perfil se retira del público pero queda
                      como placeholder en la genealogía. Restaurable en cualquier momento.
                    </span>
                  </span>
                </label>
              )}

              {/* Recordatorio si el target ya está oculto */}
              {resolveMode === 'removed' && report.target_is_hidden && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-900 flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Este {report.target_type === 'dog' ? 'perro' : 'criadero'} ya está oculto.
                    No hace falta repetir la acción.
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={resolve}
                disabled={pending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-medium text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Check className="h-4 w-4" />
                Confirmar resolución
              </button>
            </div>
          )}
        </>
      )}

      {/* Si está resuelto → mostrar info + botón reabrir */}
      {!isOpen && (
        <div className="space-y-3">
          {report.resolution_action && (
            <div className="rounded-lg bg-surface-soft px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">
                Acción tomada
              </p>
              <p className="text-sm text-ink">{report.resolution_action}</p>
            </div>
          )}
          {report.resolution_notes && (
            <div className="rounded-lg bg-surface-soft px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">
                Notas internas
              </p>
              <p className="text-sm text-body whitespace-pre-wrap">{report.resolution_notes}</p>
            </div>
          )}
          <button
            type="button"
            onClick={reopen}
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2 text-xs font-medium text-body hover:text-ink hover:bg-surface-soft disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Reabrir reporte
          </button>
          {error && (
            <div className="text-xs text-red-700">{error}</div>
          )}
        </div>
      )}
    </div>
  )
}
