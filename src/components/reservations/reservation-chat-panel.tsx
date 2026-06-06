'use client'

/**
 * ReservationChatPanel — chat con el criador como panel lateral derecho.
 *
 * Inspirado en dos patrones del propio Genealogic:
 *  - GenosPanel: panel full-height (top-0 bottom-0 right-0), header fijo
 *    + body scroll + composer fijo. flex flex-col + flex-1 min-h-0.
 *  - PedigreeTree COI panel: tab sutil para desplegar/plegar. h-14 w-7,
 *    pegada al borde izquierdo del panel, solo icono chevron, neutral
 *    border-r-0 para fundirse con el panel.
 *
 * Layout responsivo:
 *  - xl+ (≥1280px): el panel hace push del contenido (margin-right).
 *    Tab plegable estilo COI visible cuando está cerrado.
 *  - lg- (móvil/tablet): el panel es overlay full-screen con backdrop blur.
 *    FAB redondo bottom-right como toggle.
 *
 * Estado persistido en localStorage entre páginas.
 */

import { useState, useEffect, type ReactNode } from 'react'
import { MessageCircle, X, ChevronLeft, Building2 } from 'lucide-react'

interface ReservationChatPanelProps {
  /** Contenido principal de la página — adapta margin-right cuando el
   *  panel está abierto en xl+. */
  children: ReactNode
  /** Logo/avatar de la otra parte de la conversación. Si es null se
   *  muestra un avatar con la inicial de `otherSideName`. */
  otherSideLogoUrl: string | null
  /** Nombre de la otra parte (kennel para vista cliente, cliente para
   *  vista criador). */
  otherSideName: string
  /** Subtítulo del header — por defecto "Conversación · Genealogic". */
  otherSideTagline?: string | null
  chatBody: ReactNode
  /** Número de mensajes sin leer — badge en la tab/FAB cuando está cerrado. */
  unreadCount?: number
}

const LS_KEY = 'genealogic.reservationChatOpen'

export default function ReservationChatPanel({
  children, otherSideLogoUrl, otherSideName, otherSideTagline, chatBody, unreadCount = 0,
}: ReservationChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null
    if (stored === 'true') setIsOpen(true)
    else if (stored === 'false') setIsOpen(false)
    else setIsOpen(typeof window !== 'undefined' && window.innerWidth >= 1280)
  }, [])

  useEffect(() => {
    if (!hasMounted) return
    localStorage.setItem(LS_KEY, String(isOpen))
  }, [isOpen, hasMounted])

  // Block body scroll cuando el overlay mobile está abierto
  useEffect(() => {
    if (!hasMounted) return
    if (isOpen && window.innerWidth < 1280) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen, hasMounted])

  // Esc cierra
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  // Click en links a #mensajes / #chat → abre el panel
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
      {/* ─── CONTENIDO PRINCIPAL — push margin en xl+ ───
          Usamos data-attribute + clase generada en build-time. Las
          clases xl:mr-[420px] se incluyen en el bundle solo si están
          escritas literalmente en el código fuente (Tailwind las
          detecta con regex). */}
      <div
        className={`transition-[margin] duration-300 ease-out ${
          hasMounted && isOpen ? 'xl:mr-[420px]' : 'xl:mr-0'
        }`}
      >
        {children}
      </div>

      {/* ─── BACKDROP (solo overlay mobile) ─── */}
      <div
        onClick={() => setIsOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm xl:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ─── FAB MÓVIL/TABLET ───
          Posición: bottom-24 right-4 → 96px de abajo para dejar libre el
          FeedbackButton (bottom-4) en la misma columna. z-40: por debajo de
          Genos panel (z-70) y de su backdrop (z-60), así no flota por encima
          del chatbot cuando se despliega. Cuando el panel chat se abre como
          overlay mobile (z-70), el botón "X" interno cierra, así que el FAB
          puede quedarse en z-40 sin problema. */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Cerrar chat' : `Abrir chat con ${otherSideName}`}
        className={`xl:hidden fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full shadow-2xl transition-transform flex items-center justify-center ${
          isOpen
            ? 'bg-canvas text-ink border border-hairline scale-90'
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
      {/* fixed top-0 bottom-0 right-0 → full viewport height (no h-screen
          que en mobile cuenta con la barra del navegador). flex flex-col
          deja que header sea flex-shrink-0 y body flex-1 min-h-0. */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-[70] bg-canvas border-l border-hairline shadow-2xl flex flex-col transition-transform duration-300 ease-out w-full sm:w-[420px] xl:w-[420px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'var(--safe-area-bottom)',
        }}
        aria-hidden={!isOpen}
      >
        {/* ─── TAB SUTIL PLEGABLE (estilo COI panel) ───
            Solo visible en xl+. Cuando el panel está abierto, esta tab
            sirve para cerrarlo (chevron derecha). Cuando está cerrado, el
            panel está translateado fuera, pero la tab queda visible porque
            está posicionada absolute -left-7 dentro del panel. Trick: la
            ENVOLVEMOS en un wrapper aparte que NO se translatea cuando el
            panel sí. Implementado abajo como hermano del aside. */}

        {/* Header */}
        <header className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-hairline flex-shrink-0 bg-gradient-to-br from-canvas via-canvas to-surface-soft/40">
          {otherSideLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={otherSideLogoUrl}
              alt=""
              className="h-11 w-11 rounded-full object-cover border border-hairline flex-shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-ink text-on-primary flex items-center justify-center text-[15px] font-bold flex-shrink-0">
              {otherSideName[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-ink truncate leading-tight">{otherSideName}</p>
            <p className="text-[11.5px] text-muted flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3" />
              {otherSideTagline || 'Conversación · Genealogic'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar chat"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-surface-soft transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Body — chat thread fill height */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {chatBody}
        </div>
      </aside>

      {/* ─── TAB COI-STYLE (solo cuando panel está CERRADO en xl+) ───
          Pequeña pestaña 56×28px pegada al borde derecho del viewport,
          igual que el panel COI del pedigree tree. */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={`Abrir chat con ${otherSideName}`}
          title={`Abrir chat con ${otherSideName}`}
          className="hidden xl:flex fixed top-1/2 -translate-y-1/2 right-0 z-[65] h-14 w-7 items-center justify-center rounded-l-lg border border-r-0 border-hairline bg-canvas text-muted hover:text-ink transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-amber-400 text-amber-950 text-[9px] font-bold border border-canvas">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </>
  )
}
