/**
 * Grid de documentos de un perro. Reutilizado por:
 *  - /mis-perros/[id]  (lector cliente, sin acciones)
 *  - /dogs/[id]/papeles (lado criador, con botón borrar opcional)
 *
 * Sin acciones por defecto. Si `onDeleteAction` se pasa, muestra menú de
 * borrado por documento (form action server).
 */
'use client'
import { useState, useTransition } from 'react'
import { FileText, Download, Trash2, Calendar, EyeOff } from 'lucide-react'
import type { DogDocument } from '@/lib/dogs/documents-shared'
import { labelForType, formatFileSize } from '@/lib/dogs/documents-shared'

export default function DogDocumentsGrid({
  documents,
  showVisibilityBadge = false,
  onDeleteAction,
}: {
  documents: DogDocument[]
  /** Mostrar badge "Privado" cuando visible_to_owner=false (vista del criador). */
  showVisibilityBadge?: boolean
  /** Server action (formData con id) para borrar. Si no, sin botón borrar. */
  onDeleteAction?: (formData: FormData) => Promise<void>
}) {
  const [pending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-8 text-center">
        <FileText className="mx-auto mb-2 h-8 w-8 text-muted" />
        <p className="text-sm text-muted">Aún no hay documentos.</p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="group rounded-xl border border-hairline bg-canvas p-4 hover:border-ink/30 transition"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-card flex items-center justify-center">
              <FileText className="h-5 w-5 text-ink" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">{doc.title}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mt-0.5">
                {labelForType(doc.type)}
              </p>
              {doc.description && (
                <p className="text-xs text-body mt-1.5 line-clamp-2">{doc.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted">
                {doc.issued_at && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.issued_at).toLocaleDateString('es-ES')}
                  </span>
                )}
                {doc.file_size_bytes != null && (
                  <span>{formatFileSize(doc.file_size_bytes)}</span>
                )}
                {showVisibilityBadge && !doc.visible_to_owner && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 font-semibold">
                    <EyeOff className="h-3 w-3" />
                    Privado
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
            >
              <Download className="h-3.5 w-3.5" />
              Abrir / Descargar
            </a>
            {onDeleteAction && (
              <form
                action={(fd) => {
                  if (!confirm(`¿Borrar "${doc.title}"? Esta acción no se puede deshacer.`)) return
                  setDeletingId(doc.id)
                  startTransition(() => onDeleteAction(fd))
                }}
              >
                <input type="hidden" name="id" value={doc.id} />
                <button
                  type="submit"
                  disabled={pending && deletingId === doc.id}
                  className="inline-flex items-center justify-center rounded-lg border border-hairline px-2 py-1.5 text-xs text-muted hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                  title="Borrar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
