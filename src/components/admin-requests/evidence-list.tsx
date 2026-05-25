/**
 * Lista de evidencias subidas en una solicitud.
 * Cada item es un signed URL bajo demanda para no exponerlas públicamente.
 */
'use client'

import { useState } from 'react'
import { getEvidenceSignedUrlAction } from '@/lib/admin-requests/actions'
import type { EvidenceFile } from '@/lib/admin-requests/types'
import { FileText, Image as ImageIcon, ExternalLink, Loader2 } from 'lucide-react'

export default function EvidenceList({ evidence }: { evidence: EvidenceFile[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function openEvidence(path: string) {
    setError('')
    setLoading(path)
    try {
      const url = await getEvidenceSignedUrlAction(path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error abriendo')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-1.5">
      {error && <p className="text-xs text-red-600">{error}</p>}
      {evidence.map((e) => {
        const isImage = e.mime?.startsWith('image/')
        const Icon = isImage ? ImageIcon : FileText
        const sizeKB = Math.round(e.size / 1024)
        return (
          <button
            key={e.path}
            onClick={() => openEvidence(e.path)}
            disabled={loading === e.path}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg bg-surface-soft hover:bg-surface-card transition disabled:opacity-50"
          >
            <Icon className="w-4 h-4 text-muted flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink truncate">{e.filename}</p>
              <p className="text-[10px] text-muted">
                {e.mime} · {sizeKB < 1024 ? `${sizeKB} KB` : `${(sizeKB / 1024).toFixed(1)} MB`}
              </p>
            </div>
            {loading === e.path
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />
              : <ExternalLink className="w-3.5 h-3.5 text-muted" />}
          </button>
        )
      })}
    </div>
  )
}
