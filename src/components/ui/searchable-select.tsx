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
      {label && <label className="text-xs font-semibold text-fg-dim uppercase tracking-wider mb-1.5 block">{label}</label>}
      <div
        onClick={() => { if (!disabled) { setOpen(!open); setSearch('') } }}
        className={`w-full bg-chip border border-hair rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 cursor-pointer transition ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-hair-strong'
        } ${open ? 'border-[#D74709]' : ''}`}
      >
        {selected ? (
          <>
            {selected.image && (
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-chip border border-hair">
                <img src={selected.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <span className="text-white flex-1 truncate">{selected.label}</span>
          </>
        ) : (
          <span className="text-fg-mute flex-1">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false) }}
              className="text-fg-mute hover:text-fg-dim transition"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-fg-mute transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute z-[80] mt-1 w-full bg-ink-800 border border-hair rounded-lg shadow-xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-hair">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-mute" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-chip border border-hair rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-fg-mute p-3 text-center">Sin resultados</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition ${
                    opt.value === value
                      ? 'bg-[#D74709]/15 text-[#D74709]'
                      : 'text-fg hover:bg-chip hover:text-fg'
                  }`}
                >
                  {opt.image !== undefined && (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-chip border border-hair">
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
                    {opt.subtitle && <span className="text-[11px] text-fg-mute truncate block">{opt.subtitle}</span>}
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
