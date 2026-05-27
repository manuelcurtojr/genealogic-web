/**
 * Form reutilizable de reclamación (perro o criadero).
 *
 * Pasos en una sola pantalla:
 *  1) Mensaje explicando la propiedad
 *  2) Subir evidencias (uploader privado)
 *  3) Confirmar
 *
 * El tempId que se genera al montar se usa como subcarpeta en Storage
 * para agrupar los ficheros mientras el form está abierto.
 */
'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClaimRequestAction } from '@/lib/admin-requests/actions'
import type { EvidenceFile } from '@/lib/admin-requests/types'
import EvidenceUploader from './evidence-uploader'
import { Loader2, Send, Dog, Store, ShieldCheck, AlertCircle } from 'lucide-react'

export default function ClaimForm({
  targetType,
  targetId,
  targetName,
}: {
  targetType: 'dog' | 'kennel'
  targetId: string
  targetName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [evidence, setEvidence] = useState<EvidenceFile[]>([])
  const [error, setError] = useState('')
  const tempId = useMemo(() => `temp-${Date.now()}`, [])
  const Icon = targetType === 'dog' ? Dog : Store

  const requiredEvidence = targetType === 'kennel' ? 'Certificado del afijo a tu nombre, pedigree de tus perros, contrato con la federación…' : 'Pedigree a tu nombre, contrato de venta, cartilla sanitaria con tu titularidad, foto del perro contigo…'

  function submit() {
    setError('')
    if (message.trim().length < 20) {
      setError('Explica brevemente por qué es tuyo (mín. 20 caracteres)')
      return
    }
    if (evidence.length === 0) {
      setError('Sube al menos una evidencia')
      return
    }
    startTransition(async () => {
      try {
        const { id } = await createClaimRequestAction({
          type: targetType === 'dog' ? 'claim_dog' : 'claim_kennel',
          targetId,
          message: message.trim(),
          evidence,
        })
        router.push(`/mis-solicitudes/${id}?created=1`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error'
        const friendly =
          msg === 'claim_already_pending' ? 'Ya tienes una reclamación pendiente sobre este target. Revisa "Mis solicitudes".' :
          msg === 'dog_already_claimed' ? 'Este perro ya tiene dueño asignado.' :
          msg === 'kennel_already_claimed' ? 'Este criadero ya tiene dueño asignado.' :
          msg === 'evidence_required' ? 'Sube al menos una evidencia.' :
          msg === 'message_too_short' ? 'El mensaje es demasiado corto (mín. 20 caracteres).' :
          msg
        setError(friendly)
      }
    })
  }

  return (
    // Padding lateral propio: la page padre solo envuelve el breadcrumb,
    // este componente vive aparte y sin px-* en mobile se pegaba a los bordes.
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-ink mb-3 sm:mb-4">
          <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-on-primary" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted">
          Reclamación de {targetType === 'dog' ? 'perro' : 'criadero'}
        </p>
        <h1 className="mt-2 text-[22px] sm:text-3xl font-bold text-ink tracking-tight leading-tight">
          ¿{targetName} es tuyo?
        </h1>
        <p className="mt-2 text-[13.5px] sm:text-sm text-body leading-snug max-w-md mx-auto">
          Aporta pruebas y un miembro del equipo verificará tu reclamación en menos de 72h.
        </p>
      </div>

      {/* Target preview */}
      <div className="rounded-xl border border-hairline bg-canvas px-4 py-3 mb-6 flex items-center gap-3">
        <Icon className="w-5 h-5 text-ink flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{targetName}</p>
          <p className="text-[11px] text-muted">{targetType === 'dog' ? 'Perro' : 'Criadero'} sin owner asignado</p>
        </div>
      </div>

      {/* Mensaje */}
      <div className="space-y-2 mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Cuéntanos por qué es tuyo *
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder={
            targetType === 'kennel'
              ? 'Soy el titular del afijo X registrado en la RSCE desde 1998…'
              : 'Compré este perro al criador X en 2022. Tengo el pedigree y los papeles a mi nombre…'
          }
          // text-base (16px) en mobile evita el zoom auto de iOS Safari
          // al hacer focus en inputs <16px. Reduce a sm en desktop.
          className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-base sm:text-sm text-ink focus:border-ink focus:outline-none resize-none"
        />
        <p className="text-[11px] text-muted">{message.trim().length} caracteres (mínimo 20)</p>
      </div>

      {/* Evidencias */}
      <div className="space-y-2 mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Evidencias *
        </label>
        <p className="text-[12.5px] text-body mb-2">
          Aporta documentación que demuestre la propiedad. Ejemplos válidos: <em>{requiredEvidence}</em>
        </p>
        <EvidenceUploader tempId={tempId} evidence={evidence} onChange={setEvidence} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={pending || message.trim().length < 20 || evidence.length === 0}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Enviar reclamación
      </button>

      <p className="text-[11px] text-muted text-center mt-4">
        Tus evidencias son privadas — solo el equipo de Genealogic puede verlas. Se borran a los 90 días si la reclamación se rechaza.
      </p>
    </div>
  )
}
