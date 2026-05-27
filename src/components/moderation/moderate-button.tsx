'use client'

/**
 * ModerateButton — botón admin para ocultar o restaurar un perro/criadero.
 *
 * Render condicional:
 *  - Si el target está visible → botón "Ocultar" rojo, abre diálogo con motivo+notas
 *  - Si el target está oculto  → botón "Restaurar" verde, abre confirmación
 *
 * Diseñado para usarse en banners admin dentro de las páginas de detalle, o
 * en listados (/admin/hidden).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import Modal from '@/components/ui/modal'
import {
  type ModerateTargetType,
  type HiddenReason,
  HIDDEN_REASON_LABELS,
} from '@/lib/moderation/types'

interface Props {
  targetType: ModerateTargetType
  targetId: string
  targetLabel?: string | null
  /** Si está oculto, info de la ocultación */
  hidden?: {
    reason: HiddenReason
    notes: string | null
    at: string
  } | null
  /** Opcional: report id que motivó (se rellena auto si viene de /admin/reports) */
  reportId?: string | null
  variant?: 'inline' | 'banner'
}

const REASONS: HiddenReason[] = [
  'rgpd_request', 'copyright', 'inaccurate', 'inappropriate',
  'impersonation', 'animal_welfare', 'duplicate',
  'owner_request', 'admin_decision', 'other',
]

export default function ModerateButton({
  targetType, targetId, targetLabel, hidden, reportId, variant = 'inline',
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [openHide, setOpenHide] = useState(false)
  const [openRestore, setOpenRestore] = useState(false)
  const [reason, setReason] = useState<HiddenReason>('rgpd_request')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function doHide() {
    setError('')
    if (!notes.trim()) {
      setError('Las notas son obligatorias para documentar la decisión')
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetType, targetId,
            action: 'hide',
            reason,
            notes: notes.trim(),
            reportId: reportId || undefined,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'No se pudo ocultar')
        }
        setOpenHide(false)
        setNotes('')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function doRestore() {
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType, targetId, action: 'unhide' }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'No se pudo restaurar')
        }
        setOpenRestore(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  // ─── Render ──────────────────────────────────────────────────
  if (hidden) {
    // Está oculto → mostrar banner + botón restaurar
    if (variant === 'banner') {
      return (
        <>
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 flex items-start gap-3">
            <EyeOff className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-900">
                Este {targetType === 'dog' ? 'perro' : 'criadero'} está oculto al público
              </p>
              <p className="text-[12px] text-red-800 mt-0.5">
                Motivo: <strong>{HIDDEN_REASON_LABELS[hidden.reason]}</strong> ·{' '}
                Desde {new Date(hidden.at).toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </p>
              {hidden.notes && (
                <p className="text-[12px] text-red-800 mt-2 italic whitespace-pre-wrap">
                  "{hidden.notes}"
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpenRestore(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-canvas border border-red-300 px-3 py-1.5 text-sm font-medium text-red-900 hover:bg-red-100 transition flex-shrink-0"
            >
              <Eye className="h-3.5 w-3.5" />
              Restaurar
            </button>
          </div>
          <RestoreModal
            open={openRestore}
            onClose={() => setOpenRestore(false)}
            onConfirm={doRestore}
            pending={pending}
            error={error}
            targetType={targetType}
            targetLabel={targetLabel}
          />
        </>
      )
    }

    return (
      <>
        <button
          type="button"
          onClick={() => setOpenRestore(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 transition"
        >
          <Eye className="h-3.5 w-3.5" />
          Restaurar
        </button>
        <RestoreModal
          open={openRestore}
          onClose={() => setOpenRestore(false)}
          onConfirm={doRestore}
          pending={pending}
          error={error}
          targetType={targetType}
          targetLabel={targetLabel}
        />
      </>
    )
  }

  // ─── Visible → botón Ocultar ─────────────────────────────────
  return (
    <>
      <button
        type="button"
        onClick={() => setOpenHide(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-canvas border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition"
      >
        <EyeOff className="h-3.5 w-3.5" />
        Ocultar
      </button>

      <Modal
        open={openHide}
        onClose={() => !pending && setOpenHide(false)}
        title={`Ocultar ${targetType === 'dog' ? 'perro' : 'criadero'}`}
      >
        <div className="space-y-4">
          {targetLabel && (
            <div className="rounded-lg bg-surface-soft px-3 py-2 text-[13px] text-body">
              Vas a ocultar: <strong className="text-ink">{targetLabel}</strong>
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900 flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Acción reversible.</strong> El registro permanece en BBDD; los descendientes
              seguirán viendo la caja en el árbol como placeholder.
            </span>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">
              Motivo <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as HiddenReason)}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{HIDDEN_REASON_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-body">
              Notas internas <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Documenta la decisión: quién lo solicitó, qué prueba aportó, fecha del email, etc."
              rows={4}
              maxLength={5000}
              className="w-full resize-y rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpenHide(false)}
              disabled={pending}
              className="flex-1 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-soft disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={doHide}
              disabled={pending}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              <EyeOff className="h-4 w-4" />
              Ocultar ahora
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function RestoreModal({
  open, onClose, onConfirm, pending, error, targetType, targetLabel,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  pending: boolean
  error: string
  targetType: ModerateTargetType
  targetLabel?: string | null
}) {
  return (
    <Modal open={open} onClose={() => !pending && onClose()} title={`Restaurar ${targetType === 'dog' ? 'perro' : 'criadero'}`}>
      <div className="space-y-4">
        {targetLabel && (
          <div className="rounded-lg bg-surface-soft px-3 py-2 text-[13px] text-body">
            Vas a restaurar: <strong className="text-ink">{targetLabel}</strong>
          </div>
        )}
        <p className="text-sm text-body">
          El {targetType === 'dog' ? 'perro' : 'criadero'} volverá a estar visible públicamente.
          Si esta acción es resultado de una contra-notificación, asegúrate de documentar el
          motivo (prueba aportada, fecha) en el reporte original o en una nota interna.
        </p>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-soft disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Eye className="h-4 w-4" />
            Restaurar
          </button>
        </div>
      </div>
    </Modal>
  )
}
