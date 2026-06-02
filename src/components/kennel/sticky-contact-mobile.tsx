/**
 * StickyContactMobile — botón flotante "Pedir información" que aparece
 * en mobile cuando el visitante hace scroll más allá del hero.
 *
 * Solo se monta en mobile (sm:hidden) y solo en kennels con owner. Si la
 * tira del chrome del kennel ya está ocupando el top, este vive en el
 * bottom-right con shadow y safe-area-inset-bottom para no chocar con
 * la home bar del iPhone.
 *
 * Se oculta cuando el user está cerca del top (hero visible) o cerca
 * del bottom (la newsletter ya tiene su propio CTA y duplicar sería ruido).
 */
'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ContactKennelButton from './contact-kennel-button'

interface Props {
  kennelId: string
  kennelName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactFormConfig: any
  reproBreedNames?: string[]
}

export default function StickyContactMobile({ kennelId, kennelName, contactFormConfig, reproBreedNames }: Props) {
  const [visible, setVisible] = useState(false)
  // Portal target — sin esto el `fixed` se vuelve relativo a algún ancestro
  // con transform/filter/backdrop-filter en el layout dashboard, dejando
  // el botón "flotante" pegado a la parte de abajo de su contenedor
  // (no a la del viewport).
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    function onScroll() {
      // Aparece al pasar el hero (~600px) y desaparece cerca del bottom
      const scrolled = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      const nearBottom = max - scrolled < 400
      setVisible(scrolled > 600 && !nearBottom)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const node = (
    <div
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-[9997] pointer-events-none transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ paddingBottom: '10px' }}
    >
      {/* Botón pill flotante full-width — variante sticky-mobile */}
      <div className="px-2.5 pointer-events-auto">
        <ContactKennelButton
          kennelId={kennelId}
          kennelName={kennelName}
          config={contactFormConfig || null}
          reproBreedNames={reproBreedNames}
          variant="sticky-mobile"
        />
      </div>
    </div>
  )

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(node, document.body)
}
