'use client'

/**
 * ReservationChatPanel — chat con el criador estilo "panel lateral plegable"
 * (patrón Genos / chatGPT / Linear).
 *
 * Layout:
 *  - xl+ (≥1280px): el panel se ancla al borde derecho con 420px. Cuando
 *    está abierto, empuja el contenido a la izquierda con margin-right.
 *    Cuando está plegado, el contenido recupera el ancho completo y solo
 *    queda visible una pestaña vertical en el borde derecho para
 *    reabrir.
 *  - lg- (<1280px): el panel es overlay full-screen que desliza desde la
 *    derecha. El toggle es un FAB redondo en bottom-right con badge de
 *    no-leídos. Backdrop blur al abrir.
 *
 * Estado persistido en localStorage (mismo entre páginas de reserva).
 *
 * Header del panel: logo del kennel + nombre + "Criadero" → el cliente
 * tiene siempre claro con quién está hablando.
 */

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { MessageCircle, X, ChevronRight, Building2 } from 'lucide-react'

interface ReservationChatPanelProps {
  /** Contenido principal de la página — recibe el espacio que sobra cuando
   *  el panel está abierto. */
  children: ReactNode
  /** Header del panel (kennel logo + nombre). Lo pasamos como ReactNode
   *  para que el server component pueda construirlo con sus joins. */
  kennelLogoUrl: string | null
  kennelName: string
  kennelTagline?: string | null
  /** Hilo de mensajes (se renderiza dentro del panel). */
  chatBody: ReactNode
  /** Número de mensajes sin leer del criador — badge en el FAB cuando
   *  el panel está cerrado. */
  unreadCount?: number
}

const LS_KEY = 'genealogic.reservationChatOpen'

export default function ReservationChatPanel({
  children, kennelLogoUrl, kennelName, kennelTagline, chatBody, unreadCount = 0,
}: ReservationChatPanelProps) {
  // Default: cerrado en SSR (evita layout shift). useEffect lo restaura
  // desde localStorage al montar — para xl+ por defecto abierto si no
  // hay valor guardado.
  const [isOpen, setIsOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHasMounted(true)
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null
    if (stored === 'true') setIsOpen(true)
    else if (stored === 'false') setIsOpen(false)
    else {
      // Default según ancho de viewport
      setIsOpen(typeof window !== 'undefined' && window.innerWidth >= 1280)
    }
  }, [])

  useEffect(() => {
    if (!hasMounted) return
    localStorage.setItem(LS_KEY, String(isOpen))
  }, [isOpen, hasMounted])

  // Bloquear scroll del body cuando el overlay mobile está abierto
  useEffect(() => {
    if (!hasMounted) return
    if (isOpen && window.innerWidth < 1280) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen, hasMounted])

  // Esc para cerrar
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  // Capturar clicks en links a "#mensajes" (QuickAction "Mensajes" de la
  // página) → abre el panel en lugar de hacer scroll a un anchor que ya
  // no existe. Bubble phase, así otros links no se ven afectados.
  useEffect(() => {
    if (!hasMounted) return
    function onAnchorClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      const anchor = target?.closest?.('a[href="#mensajes"], a[href="#chat"]') as HTMLAnchorElement | null
      if (!anchor) return
      e.preventDefault()
      setIsOpen(true)
    }
    document.addEventListener('click', onAnchorClick)
    return () => document.removeEventListener('click', onAnchorClick)
  }, [hasMounted])

  return (
    <>
      {/* ─── CONTENIDO PRINCIPAL — adapta margin-right en xl+ ─── */}
      <div
        className={`transition-[margin] duration-300 ease-out ${
          isOpen ? 'xl:mr-[440px]' : 'xl:mr-0'
        }`}
      >
        {children}
      </div>

      {/* ─── BACKDROP (solo overlay mobile) ─── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          aria-hidden
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm xl:hidden transition-opacity"
        />
      )}

      {/* ─── PESTAÑA LATERAL (xl+, solo cuando está CERRADO) ───
          Es una tab vertical anclada al borde derecho de la ventana, así
          el cliente puede reabrir el chat sin bajar al FAB de móvil. */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat con el criador"
          className="hidden xl:flex fixed top-1/2 -translate-y-1/2 right-0 z-30 items-center gap-2 rounded-l-2xl rounded-r-none bg-ink text-on-primary px-3 py-4 shadow-lg hover:opacity-90 transition-all group"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-[12px] font-bold uppercase tracking-wider [writing-mode:vertical-rl] rotate-180">
            {kennelName}
          </span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ─── FAB MÓVIL/TABLET (siempre visible) ─── */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat con el criador'}
        className={`xl:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-canvas text-ink border border-hairline'
            : 'bg-ink text-on-primary hover:scale-105'
        }`}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold border-2 border-canvas">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ─── PANEL CHAT ─── */}
      <aside
        ref={panelRef}
        className={`fixed top-0 right-0 z-40 h-screen bg-canvas border-l border-hairline shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full sm:w-[420px] xl:w-[420px]`}
        aria-hidden={!isOpen}
      >
        {/* Header con kennel info */}
        <header className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-hairline bg-gradient-to-br from-canvas via-canvas to-surface-soft/60 flex-shrink-0">
          {kennelLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={kennelLogoUrl}
              alt=""
              className="h-11 w-11 rounded-full object-cover border border-hairline flex-shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-ink text-on-primary flex items-center justify-center text-[15px] font-bold flex-shrink-0">
              {kennelName[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-ink truncate leading-tight">{kennelName}</p>
            <p className="text-[11.5px] text-muted flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3" />
              {kennelTagline || 'Criadero · Genealogic'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar chat"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-surface-soft transition-colors flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4 hidden xl:block" />
            <X className="h-4 w-4 xl:hidden" />
          </button>
        </header>

        {/* Body — chat thread scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {chatBody}
        </div>
      </aside>
    </>
  )
}
