'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Seleccionar...', label }: SearchableSelectProps) {
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
      {label && <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</label>}
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch('') }}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between transition focus:border-[#D74709] focus:outline-none"
      >
        <span className={selected ? 'text-white' : 'text-white/30'}>{selected?.label || placeholder}</span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false) }}
              className="text-white/30 hover:text-white/60 transition"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-white/10 rounded-lg shadow-xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-white/5">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-white/30 p-3 text-center">Sin resultados</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                  className={`w-full text-left px-3 py-2 text-sm transition ${
                    opt.value === value
                      ? 'bg-[#D74709]/15 text-[#D74709]'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
