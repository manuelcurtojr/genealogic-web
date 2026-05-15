'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Render `children` into `document.body` so they escape every ancestor's
 * stacking context AND any transform-induced fixed-positioning traps.
 *
 * Slide panels, modals and lightboxes should all wrap their content in <Portal>
 * to guarantee they cover the whole viewport regardless of where they're
 * declared in the component tree.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}
