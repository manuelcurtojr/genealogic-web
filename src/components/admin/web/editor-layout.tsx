'use client'

import { useEffect, useState, useCallback } from 'react'
import { EditorPanelsProvider } from './editor-panels-context'

const LS_LEFT = 'editor:leftCollapsed'
const LS_RIGHT = 'editor:rightCollapsed'

/**
 * Shell client del editor con paneles laterales plegables. La preferencia
 * se persiste en localStorage. Expone el estado via EditorPanelsContext
 * para que la barra del PreviewFrame pueda renderizar los toggles
 * integrados con los botones Desktop/Tablet/Móvil — sin botones flotantes
 * que se solapen con el contenido.
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

  const toggleLeft = useCallback(() => {
    setLeftCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(LS_LEFT, next ? '1' : '0') } catch { /* */ }
      return next
    })
  }, [])
  const toggleRight = useCallback(() => {
    setRightCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(LS_RIGHT, next ? '1' : '0') } catch { /* */ }
      return next
    })
  }, [])

  // SSR: default sin colapsar. Tras mount, aplicar preferencia guardada.
  const effectiveLeft = mounted ? leftCollapsed : false
  const effectiveRight = mounted ? rightCollapsed : false
  const leftW = effectiveLeft ? '0px' : '280px'
  const rightW = effectiveRight ? '0px' : '360px'

  return (
    <EditorPanelsProvider
      value={{
        leftCollapsed: effectiveLeft,
        rightCollapsed: effectiveRight,
        toggleLeft,
        toggleRight,
      }}
    >
      <div
        className="flex-1 grid grid-cols-1 lg:[grid-template-columns:var(--cols)] overflow-hidden lg:transition-[grid-template-columns] lg:duration-300"
        style={{ ['--cols' as any]: `${leftW} 1fr ${rightW}` }}
      >
        <aside
          className={`flex flex-col border-r border-hairline bg-canvas overflow-hidden ${
            effectiveLeft ? 'lg:opacity-0 lg:pointer-events-none' : ''
          }`}
        >
          {left}
        </aside>

        <main className="overflow-hidden bg-surface-card">{center}</main>

        <aside
          className={`border-l border-hairline bg-canvas overflow-y-auto ${
            effectiveRight ? 'lg:opacity-0 lg:pointer-events-none' : ''
          }`}
        >
          {right}
        </aside>
      </div>
    </EditorPanelsProvider>
  )
}
