/**
 * Componente para subir múltiples ficheros de evidencia.
 *
 * Devuelve los EvidenceFile via callback. Sube cada uno por separado a
 * Storage (privado) y guarda el path. La validación de mime/size va aquí
 * y también en la server action.
 */
'use client'

import { useState, useRef } from 'react'
import { uploadEvidenceAction } from '@/lib/admin-requests/actions'
import type { EvidenceFile } from '@/lib/admin-requests/types'
import { Upload, FileText, Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

export default function EvidenceUploader({
  tempId,
  evidence,
  onChange,
  maxFiles = 6,
}: {
  tempId: string
  evidence: EvidenceFile[]
  onChange: (next: EvidenceFile[]) => void
  maxFiles?: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)
    const newEvidence = [...evidence]
    try {
      for (let i = 0; i < files.length; i++) {
        if (newEvidence.length >= maxFiles) {
          setError(`Máximo ${maxFiles} ficheros`)
          break
        }
        const file = files[i]
        if (!ALLOWED.includes(file.type)) {
          setError(`Formato no permitido: ${file.name}`)
          continue
        }
        if (file.size > MAX_SIZE) {
          setError(`${file.name}: demasiado grande (>10MB)`)
          continue
        }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('tempId', tempId)
        const uploaded = await uploadEvidenceAction(fd)
        newEvidence.push(uploaded)
      }
      onChange(newEvidence)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeOne(path: string) {
    onChange(evidence.filter((e) => e.path !== path))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed bg-canvas px-4 py-6 text-center transition ${
          uploading ? 'border-ink/30 opacity-60' : 'border-hairline hover:border-ink/40'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heic,.pdf,image/*,application/pdf"
          multiple
          disabled={uploading || evidence.length >= maxFiles}
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <Upload className={`mx-auto w-6 h-6 ${uploading ? 'text-muted animate-pulse' : 'text-ink'}`} />
        <p className="mt-2 text-sm font-semibold text-ink">
          {uploading ? 'Subiendo…' : 'Click o arrastra archivos aquí'}
        </p>
        <p className="text-[11px] text-muted mt-1">
          JPG, PNG, WEBP, HEIC o PDF · Máx 10MB cada uno · {maxFiles - evidence.length} restantes
        </p>
      </div>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Lista subidos */}
      {evidence.length > 0 && (
        <ul className="space-y-1.5">
          {evidence.map((e) => {
            const isImage = e.mime?.startsWith('image/')
            const Icon = isImage ? ImageIcon : FileText
            const sizeKB = Math.round(e.size / 1024)
            return (
              <li
                key={e.path}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-soft"
              >
                <Icon className="w-4 h-4 text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{e.filename}</p>
                  <p className="text-[10px] text-muted">
                    {sizeKB < 1024 ? `${sizeKB} KB` : `${(sizeKB / 1024).toFixed(1)} MB`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeOne(e.path)}
                  className="text-muted hover:text-red-600 transition"
                  title="Quitar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
