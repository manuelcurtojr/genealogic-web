'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Search } from 'lucide-react'

interface Option {
  value: string
  label: string
  image?: string | null
  subtitle?: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Seleccionar...', label, disabled }: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  return (
    <div ref={ref} className="relative">
      {label && <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1.5 block">{label}</label>}
      <div
        onClick={() => { if (!disabled) { setOpen(!open); setSearch('') } }}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border bg-canvas px-3 py-2.5 text-[14px] transition-colors ${
          disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-surface-soft'
        } ${open ? 'border-ink ring-1 ring-ink' : 'border-hairline'}`}
      >
        {selected ? (
          <>
            {selected.image && (
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-surface-card border border-hairline">
                <img src={selected.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <span className="flex-1 truncate text-ink">{selected.label}</span>
          </>
        ) : (
          <span className="text-muted flex-1">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false) }}
              className="text-muted hover:text-body transition"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute z-[80] mt-1 flex max-h-72 w-full flex-col overflow-hidden rounded-lg border border-hairline bg-canvas shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="border-b border-hairline p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded border border-hairline bg-canvas py-1.5 pl-8 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-3 text-center text-[13px] text-muted">Sin resultados</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors ${
                    opt.value === value
                      ? 'bg-surface-card font-medium text-ink'
                      : 'text-body hover:bg-surface-soft hover:text-ink'
                  }`}
                >
                  {opt.image !== undefined && (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-surface-card border border-hairline">
                      {opt.image ? (
                        <img src={opt.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <img src="/icon.svg" alt="" className="w-3.5 h-3.5 opacity-30" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="truncate block">{opt.label}</span>
                    {opt.subtitle && <span className="text-[11px] text-muted truncate block">{opt.subtitle}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
