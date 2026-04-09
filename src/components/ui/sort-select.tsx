'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ArrowDownUp } from 'lucide-react'

export type SortOption = 'updated' | 'created' | 'alpha'

const SORT_LABELS: Record<SortOption, string> = {
  updated: 'Últimos modificados',
  created: 'Últimos añadidos',
  alpha: 'Alfabéticamente',
}

interface SortSelectProps {
  value: SortOption
  onChange: (v: SortOption) => void
  storageKey: string
}

export function useSortPreference(storageKey: string, defaultSort: SortOption = 'updated'): [SortOption, (v: SortOption) => void] {
  const [sort, setSort] = useState<SortOption>(() => {
    if (typeof window === 'undefined') return defaultSort
    return (localStorage.getItem(storageKey) as SortOption) || defaultSort
  })

  const changeSort = (v: SortOption) => {
    setSort(v)
    localStorage.setItem(storageKey, v)
  }

  return [sort, changeSort]
}

export function sortItems<T>(items: T[], sort: SortOption, nameKey: string = 'name'): T[] {
  const sorted = [...items]
  switch (sort) {
    case 'updated':
      return sorted.sort((a: any, b: any) => {
        const dateA = a.updated_at || a.created_at || '1970-01-01'
        const dateB = b.updated_at || b.created_at || '1970-01-01'
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
    case 'created':
      return sorted.sort((a: any, b: any) => {
        const dateA = a.created_at || '1970-01-01'
        const dateB = b.created_at || '1970-01-01'
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
    case 'alpha':
      return sorted.sort((a: any, b: any) =>
        (a[nameKey] || '').localeCompare(b[nameKey] || '', 'es', { sensitivity: 'base' })
      )
    default:
      return sorted
  }
}

export default function SortSelect({ value, onChange }: SortSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer whitespace-nowrap"
      >
        <ArrowDownUp className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden sm:inline">{SORT_LABELS[value]}</span>
        <ChevronDown className={`w-3 h-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[180px]">
          {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => { onChange(k); setOpen(false) }}
              className={`w-full text-left px-3 py-2.5 text-sm transition ${
                value === k
                  ? 'bg-[#D74709]/15 text-[#D74709] font-medium'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
