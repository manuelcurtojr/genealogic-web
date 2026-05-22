'use client'

import { useEffect, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'

const LS_LEFT = 'editor:leftCollapsed'
const LS_RIGHT = 'editor:rightCollapsed'

/**
 * Shell client del editor con paneles laterales plegables. La preferencia
 * se persiste en localStorage. En mobile siempre full-width (un panel a la
 * vez), los toggles solo aplican en desktop (lg+).
 */
export function EditorLayout({
  left, center, right,
}: {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
}) {
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      setLeftCollapsed(localStorage.getItem(LS_LEFT) === '1')
      setRightCollapsed(localStorage.getItem(LS_RIGHT) === '1')
    } catch { /* */ }
    setMounted(true)
  }, [])

  function toggleLeft() {
    const next = !leftCollapsed
    setLeftCollapsed(next)
    try { localStorage.setItem(LS_LEFT, next ? '1' : '0') } catch { /* */ }
  }
  function toggleRight() {
    const next = !rightCollapsed
    setRightCollapsed(next)
    try { localStorage.setItem(LS_RIGHT, next ? '1' : '0') } catch { /* */ }
  }

  // SSR: render por defecto (left + right desplegados) y luego el cliente
  // ajusta tras montar para no parpadear si el usuario tenía colapsado.
  const effectiveLeft = mounted ? leftCollapsed : false
  const effectiveRight = mounted ? rightCollapsed : false
  const leftW = effectiveLeft ? '0px' : '280px'
  const rightW = effectiveRight ? '0px' : '360px'

  return (
    <div
      className="flex-1 grid grid-cols-1 lg:[grid-template-columns:var(--cols)] overflow-hidden lg:transition-[grid-template-columns] lg:duration-300"
      style={{ ['--cols' as any]: `${leftW} 1fr ${rightW}` }}
    >
      {/* Left panel */}
      <aside
        className={`flex flex-col border-r border-hairline bg-canvas overflow-hidden ${
          effectiveLeft ? 'lg:opacity-0 lg:pointer-events-none' : ''
        }`}
      >
        {left}
      </aside>

      {/* Center con toggles flotantes */}
      <main className="relative overflow-hidden bg-surface-card">
        <button
          type="button"
          onClick={toggleLeft}
          title={leftCollapsed ? 'Mostrar lista de secciones' : 'Plegar lista de secciones'}
          aria-label={leftCollapsed ? 'Mostrar lista' : 'Plegar lista'}
          className="hidden lg:flex absolute top-3 left-3 z-10 w-8 h-8 items-center justify-center rounded-lg border border-hairline bg-canvas text-muted hover:text-ink hover:border-ink/30 transition shadow-sm"
        >
          {leftCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={toggleRight}
          title={rightCollapsed ? 'Mostrar editor de propiedades' : 'Plegar editor de propiedades'}
          aria-label={rightCollapsed ? 'Mostrar editor' : 'Plegar editor'}
          className="hidden lg:flex absolute top-3 right-3 z-10 w-8 h-8 items-center justify-center rounded-lg border border-hairline bg-canvas text-muted hover:text-ink hover:border-ink/30 transition shadow-sm"
        >
          {rightCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
        </button>
        {center}
      </main>

      {/* Right panel */}
      <aside
        className={`border-l border-hairline bg-canvas overflow-y-auto ${
          effectiveRight ? 'lg:opacity-0 lg:pointer-events-none' : ''
        }`}
      >
        {right}
      </aside>
    </div>
  )
}
