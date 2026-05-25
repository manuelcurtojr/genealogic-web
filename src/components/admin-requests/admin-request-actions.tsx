/**
 * Panel lateral de acciones del admin sobre una solicitud.
 *
 *  - Cambiar status / priority (acciones rápidas)
 *  - Si es claim → botón APROBAR (transfiere ownership)
 *  - Botón RECHAZAR con razón obligatoria
 *  - Notas internas del admin
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  adminUpdateRequestAction,
  adminApproveClaimAction,
  adminRejectRequestAction,
} from '@/lib/admin-requests/actions'
import { Check, X, Loader2, AlertCircle, Save, ShieldCheck } from 'lucide-react'
import type {
  AdminRequestType, AdminRequestStatus, AdminRequestPriority,
} from '@/lib/admin-requests/types'

export default function AdminRequestActions({
  request,
}: {
  request: {
    id: string
    type: AdminRequestType
    status: AdminRequestStatus
    priority: AdminRequestPriority
    adminNotes: string
  }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [confirmingApprove, setConfirmingApprove] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [notes, setNotes] = useState(request.adminNotes)

  const isClaim = request.type !== 'support'
  const isOpen = !['approved', 'rejected', 'cancelled'].includes(request.status)

  function update(patch: Parameters<typeof adminUpdateRequestAction>[0]) {
    setError('')
    startTransition(async () => {
      try {
        await adminUpdateRequestAction(patch)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function approve() {
    setError('')
    startTransition(async () => {
      try {
        await adminApproveClaimAction({
          requestId: request.id,
          resolutionNote: resolutionNote.trim() || undefined,
        })
        setConfirmingApprove(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error aprobando')
      }
    })
  }

  function reject() {
    setError('')
    if (!rejectReason.trim()) {
      setError('La razón es obligatoria')
      return
    }
    startTransition(async () => {
      try {
        await adminRejectRequestAction({
          requestId: request.id,
          resolutionNote: rejectReason.trim(),
        })
        setShowRejectForm(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error rechazando')
      }
    })
  }

  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4 space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Acciones</p>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Status quick switch */}
      {isOpen && (
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Estado</label>
          <select
            value={request.status}
            onChange={(e) => update({ requestId: request.id, status: e.target.value as AdminRequestStatus })}
            disabled={pending}
            className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
          >
            <option value="pending">Pendiente</option>
            <option value="reviewing">En revisión</option>
            <option value="awaiting_user">Esperando al user</option>
          </select>
        </div>
      )}

      {/* Priority */}
      {isOpen && (
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Prioridad</label>
          <div className="grid grid-cols-4 gap-1">
            {(['low', 'normal', 'high', 'urgent'] as AdminRequestPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => update({ requestId: request.id, priority: p })}
                disabled={pending}
                className={`py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition ${
                  request.priority === p
                    ? 'bg-ink text-on-primary'
                    : 'bg-surface-card text-body hover:bg-surface-soft'
                } disabled:opacity-50`}
              >
                {p === 'low' ? 'Baja' : p === 'normal' ? 'Norm' : p === 'high' ? 'Alta' : 'URG'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Admin notes */}
      {isOpen && (
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Notas internas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Solo visibles para admins…"
            className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none resize-none"
          />
          <button
            onClick={() => update({ requestId: request.id, adminNotes: notes })}
            disabled={pending}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
          >
            <Save className="w-3 h-3" /> Guardar notas
          </button>
        </div>
      )}

      {/* Aprobar (solo claims) */}
      {isClaim && isOpen && (
        <div className="pt-3 border-t border-hairline">
          {!confirmingApprove ? (
            <button
              onClick={() => setConfirmingApprove(true)}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2.5 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              Aprobar reclamación
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink">¿Aprobar y transferir ownership?</p>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={2}
                placeholder="Nota visible para el user (opcional)"
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={approve}
                  disabled={pending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Check className="w-3.5 h-3.5" /> Confirmar
                </button>
                <button
                  onClick={() => setConfirmingApprove(false)}
                  disabled={pending}
                  className="px-3 py-2 text-xs text-body hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rechazar */}
      {isOpen && (
        <div className={isClaim ? '' : 'pt-3 border-t border-hairline'}>
          {!showRejectForm ? (
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2 text-xs font-semibold text-body hover:border-red-300 hover:text-red-700 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              {isClaim ? 'Rechazar reclamación' : 'Cerrar como rechazada'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink">Razón del rechazo (obligatoria, visible al user):</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Ej: las evidencias aportadas no permiten verificar la propiedad…"
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={reject}
                  disabled={pending || !rejectReason.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 text-white px-3 py-2 text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Rechazar
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  disabled={pending}
                  className="px-3 py-2 text-xs text-body hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
