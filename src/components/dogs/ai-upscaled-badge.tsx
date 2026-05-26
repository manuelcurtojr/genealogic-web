'use client'

import { Sparkles } from 'lucide-react'
import { useState } from 'react'

interface AiUpscaledBadgeProps {
  upscaledAt?: string | null
  originalUrl?: string | null
  /** Tamaño visual del chip: 'sm' (cards) o 'md' (ficha hero) */
  size?: 'sm' | 'md'
  /** Alineación dentro del contenedor relativo padre */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

/**
 * Chip discreto para indicar que la foto fue mejorada con Real-ESRGAN.
 * Hover/click muestra mensaje aclaratorio + enlace a foto original (si se pasa).
 *
 * Honesto con el usuario: la IA puede inventar detalles, por lo que siempre
 * ofrecemos acceso a la original para criadores que necesiten ver morfología real.
 */
export default function AiUpscaledBadge({
  upscaledAt,
  originalUrl,
  size = 'sm',
  position = 'top-left',
}: AiUpscaledBadgeProps) {
  const [open, setOpen] = useState(false)
  if (!upscaledAt) return null

  const posClass = {
    'top-left': 'left-2 top-2',
    'top-right': 'right-2 top-2',
    'bottom-left': 'left-2 bottom-2',
    'bottom-right': 'right-2 bottom-2',
  }[position]

  const sizeClass = size === 'md'
    ? 'px-2.5 py-1 text-[12px] gap-1.5'
    : 'px-2 py-0.5 text-[10.5px] gap-1'

  const iconClass = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'

  return (
    <div className={`absolute z-10 ${posClass}`}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v) }}
        className={`inline-flex items-center rounded-full bg-canvas font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-colors hover:bg-surface-soft ${sizeClass}`}
        title="Foto mejorada con IA"
      >
        <Sparkles className={iconClass} />
        <span>Mejorada con IA</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-hairline bg-canvas p-3 text-[11.5px] text-ink shadow-lg">
          <p>
            Esta foto fue restaurada automáticamente con IA (Real-ESRGAN) porque
            la original era de muy baja resolución.
          </p>
          {originalUrl && (
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[11.5px] font-medium text-ink underline underline-offset-2 hover:no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              Ver foto original →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
