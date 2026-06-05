'use client'

/**
 * Botón "Copiar link de vista previa". Aparece en el header del bloque de
 * contrato del criador para que pueda compartir el contrato vía
 * WhatsApp/email con el cliente ANTES de enviarlo oficialmente para firmar.
 *
 * El link apunta a /contrato-preview/[preview_token] que es público
 * (cualquiera con el token lo lee, no requiere login). Pensado para que el
 * cliente lea el contrato y decida si se registra y firma.
 *
 * Feedback visual: el botón cambia a "✓ Copiado" durante 2s tras click.
 */

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

export default function CopyPreviewLinkButton({ token, label }: { token: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://genealogic.io'
    const url = `${origin}/contrato-preview/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: prompt para copiar manual
      prompt('Copia este link:', url)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copia un link público (sin login) para que el cliente lea el contrato antes de firmar"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all ${
        copied
          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
          : 'border-hairline bg-canvas text-body hover:border-ink/30 hover:text-ink'
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? '✓ Copiado' : label}
    </button>
  )
}
