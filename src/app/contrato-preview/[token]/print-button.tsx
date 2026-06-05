'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[12.5px] font-semibold text-body hover:border-ink/30 hover:text-ink transition-colors"
    >
      <Printer className="h-3.5 w-3.5" />
      Imprimir / PDF
    </button>
  )
}
