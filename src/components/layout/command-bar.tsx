'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Search, Bell, Dog, Plus, PlusCircle, Baby, GitCompareArrows,
  Calendar, Stethoscope, KanbanSquare, UsersRound, Mail, Beaker, MessageSquare,
  BookOpen, Send, Globe, TrendingUp, Store, Edit3, BarChart3, Key, Users,
  Sparkles, Receipt, Link2, Settings, Shield, Tag, Upload, Heart, Dna,
  ArrowRight, CornerDownLeft,
} from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { commandsFor, filterCommands, type Command } from '@/lib/commands'

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Search, Bell, Dog, Plus, PlusCircle, Baby, GitCompareArrows,
  Calendar, Stethoscope, KanbanSquare, UsersRound, Mail, Beaker, MessageSquare,
  BookOpen, Send, Globe, TrendingUp, Store, Edit3, BarChart3, Key, Users,
  Sparkles, Receipt, Link2, Settings, Shield, Tag, Upload, Heart, Dna,
}

interface Props {
  hasKennel: boolean
  isPro: boolean
  isAdmin: boolean
}

/**
 * Command Bar global (estilo Linear/Vercel/Notion). Se abre con ⌘K / Ctrl+K
 * desde cualquier sitio del dashboard. Permite buscar y saltar a cualquier
 * feature del producto sin tener que aprender dónde está cada cosa.
 *
 * También se abre vía window event `genealogic:open-command-bar` para que
 * cualquier botón de la UI lo pueda invocar.
 */
export function CommandBar({ hasKennel, isPro, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const allowed = useMemo(() => commandsFor({ hasKennel, isPro, isAdmin }), [hasKennel, isPro, isAdmin])
  const results = useMemo(() => filterCommands(allowed, query), [allowed, query])

  // Group por section preservando orden
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>()
    for (const c of results) {
      if (!map.has(c.section)) map.set(c.section, [])
      map.get(c.section)!.push(c)
    }
    return Array.from(map.entries())
  }, [results])

  // Flat list para navegación con teclado
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped])

  // ⌘K listener global + custom event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    function onOpen() { setOpen(true) }
    document.addEventListener('keydown', onKey)
    window.addEventListener('genealogic:open-command-bar', onOpen)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('genealogic:open-command-bar', onOpen)
    }
  }, [])

  // Reset state al abrir, focus input
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      // pequeño delay para que el input esté en el DOM
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Reset índice activo cuando cambia la query
  useEffect(() => { setActiveIdx(0) }, [query])

  // Mantener el item activo visible al hacer scroll
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-cmd-idx="${activeIdx}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const close = useCallback(() => setOpen(false), [])

  const go = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(flat.length - 1, i + 1))
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(0, i - 1))
    }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const target = flat[activeIdx]
      if (target) go(target.href)
    }
  }

  if (!open) return null

  return (
    <Portal>
      {/* Backdrop */}
      <div
        onClick={close}
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
      />
      {/* Bar */}
      <div className="fixed inset-x-0 top-[10vh] z-[210] mx-auto max-w-xl px-4">
        <div className="bg-canvas rounded-2xl border border-hairline shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline">
            <Search className="w-4 h-4 text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar o ir a…"
              className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-muted border border-hairline rounded px-1.5 py-0.5">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-muted">
                Sin resultados para <strong className="text-ink">{query}</strong>
              </div>
            ) : (
              grouped.map(([section, items]) => (
                <div key={section} className="mb-2 last:mb-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted px-3 py-1.5">
                    {section}
                  </p>
                  <div>
                    {items.map((c) => {
                      const idx = flat.indexOf(c)
                      const Icon = ICONS[c.icon] || ArrowRight
                      const active = idx === activeIdx
                      return (
                        <button
                          key={c.id}
                          data-cmd-idx={idx}
                          onClick={() => go(c.href)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                            active ? 'bg-surface-card' : 'hover:bg-surface-soft'
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-ink' : 'text-muted'}`} />
                          <span className={`flex-1 text-sm truncate ${active ? 'text-ink font-medium' : 'text-body'}`}>
                            {c.label}
                          </span>
                          {active && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-hairline bg-surface-card text-[11px] text-muted">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="font-mono border border-hairline rounded px-1 py-0.5 bg-canvas">↑</kbd>
                <kbd className="font-mono border border-hairline rounded px-1 py-0.5 bg-canvas">↓</kbd>
                navegar
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="font-mono border border-hairline rounded px-1 py-0.5 bg-canvas">↵</kbd>
                ir
              </span>
            </div>
            <span>{results.length} resultado{results.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>
    </Portal>
  )
}

/**
 * Botón "Buscar o ir a…" que abre el CommandBar al hacer click.
 * Pensado para sidebar / header. Muestra el atajo ⌘K como pista visual.
 */
export function CommandBarTrigger({ className = '', collapsed = false }: { className?: string; collapsed?: boolean }) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  function open() {
    window.dispatchEvent(new CustomEvent('genealogic:open-command-bar'))
  }
  if (collapsed) {
    return (
      <button
        onClick={open}
        title={`Buscar (${isMac ? '⌘' : 'Ctrl'}+K)`}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-muted hover:text-ink hover:bg-surface-card transition ${className}`}
      >
        <Search className="w-[18px] h-[18px]" />
      </button>
    )
  }
  return (
    <button
      onClick={open}
      className={`group flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-hairline bg-canvas text-muted hover:text-ink hover:border-ink/30 transition ${className}`}
    >
      <Search className="w-4 h-4 flex-shrink-0" />
      <span className="text-[13px] flex-1 text-left">Buscar o ir a…</span>
      <kbd className="text-[10px] font-mono border border-hairline rounded px-1.5 py-0.5 group-hover:border-ink/30 transition">
        {isMac ? '⌘' : 'Ctrl'}K
      </kbd>
    </button>
  )
}
