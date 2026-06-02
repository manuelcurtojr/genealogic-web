'use client'

/** Panel lateral derecho reutilizable (lead detail + config de funnel). */
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export default function Drawer({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 'sm:max-w-lg',
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel: full-width en móvil, ancho fijo en sm+. Header/footer fijos,
          sólo scrollea el cuerpo. En iOS respeta safe-area top/bottom (vars 0px
          en web, sin efecto). */}
      <div
        className={
          'relative h-dvh w-full ' +
          width +
          ' bg-canvas border-l border-hairline shadow-2xl flex flex-col overflow-x-hidden'
        }
        style={{
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'var(--safe-area-bottom)',
        }}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-hairline flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink truncate">{title}</h2>
            {subtitle && <div className="text-xs text-muted mt-0.5 truncate">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink flex-shrink-0 -mr-1 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && <div className="border-t border-hairline px-5 py-3 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  )
}
