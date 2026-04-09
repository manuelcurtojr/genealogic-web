'use client'

import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'

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
        const dateA = a.updated_at || a.created_at || ''
        const dateB = b.updated_at || b.created_at || ''
        return dateB.localeCompare(dateA)
      })
    case 'created':
      return sorted.sort((a: any, b: any) => {
        const dateA = a.created_at || ''
        const dateB = b.created_at || ''
        return dateB.localeCompare(dateA)
      })
    case 'alpha':
      return sorted.sort((a: any, b: any) =>
        (a[nameKey] || '').localeCompare(b[nameKey] || '', 'es', { sensitivity: 'base' })
      )
    default:
      return sorted
  }
}

export default function SortSelect({ value, onChange, storageKey }: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none cursor-pointer"
    >
      {Object.entries(SORT_LABELS).map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  )
}
