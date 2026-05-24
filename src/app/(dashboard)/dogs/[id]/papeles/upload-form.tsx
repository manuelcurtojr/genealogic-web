/**
 * Formulario de subida de documentos del perro (criador).
 * Client component porque necesita estado del file input + feedback.
 */
'use client'
import { useState, useTransition, useRef } from 'react'
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { DOCUMENT_TYPES } from '@/lib/dogs/documents-shared'
import { uploadDogDocumentAction } from './actions'

export default function UploadDogDocumentForm({ dogId }: { dogId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await uploadDogDocumentAction(dogId, fd)
      if (res.ok) {
        setSuccess(true)
        formRef.current?.reset()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(humanizeError(res.error))
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-hairline bg-canvas p-5"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Subir documento</h3>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Tipo">
          <select
            name="type"
            required
            defaultValue="contract"
            className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Título">
          <input
            type="text"
            name="title"
            required
            placeholder="Ej: Contrato de compraventa"
            className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink placeholder:text-muted"
          />
        </Field>
        <Field label="Fecha del documento (opcional)">
          <input
            type="date"
            name="issued_at"
            className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
          />
        </Field>
        <Field label="Archivo (max 25 MB)">
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,.doc,.docx"
            className="w-full text-xs text-body file:mr-2 file:rounded file:border-0 file:bg-ink file:text-on-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold hover:file:opacity-90"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Descripción (opcional)">
            <textarea
              name="description"
              rows={2}
              placeholder="Notas internas o para el propietario..."
              className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink placeholder:text-muted"
            />
          </Field>
        </div>
        <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-body cursor-pointer">
          <input
            type="checkbox"
            name="visible_to_owner"
            defaultChecked
            className="rounded border-hairline"
          />
          Visible para el propietario en su panel
        </label>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Documento subido correctamente
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-ink text-on-primary px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Subir documento
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
        {label}
      </span>
      {children}
    </label>
  )
}

function humanizeError(code: string): string {
  switch (code) {
    case 'file_required':
      return 'Selecciona un archivo'
    case 'file_too_large_25mb':
      return 'El archivo supera 25 MB'
    case 'forbidden':
      return 'No tienes permiso para subir documentos a este perro'
    case 'dog_not_found':
      return 'Perro no encontrado'
    case 'unauthorized':
      return 'Sesión no válida'
    default:
      return `Error: ${code}`
  }
}
