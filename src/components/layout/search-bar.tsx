'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Dog, Home, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

interface SearchResult {
  id: string
  slug?: string | null
  name: string
  type: 'dog' | 'kennel' | 'breed'
  subtitle?: string
  image?: string | null
  sex?: string | null
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Search debounce
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }

    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const q = query.trim()

      const [dogsRes, kennelsRes, breedsRes] = await Promise.all([
        supabase.from('dogs').select('id, slug, name, sex, thumbnail_url, breed:breeds(name)').ilike('name', `%${q}%`).limit(3),
        supabase.from('kennels').select('id, slug, name, logo_url').ilike('name', `%${q}%`).limit(3),
        supabase.from('breeds').select('id, name').ilike('name', `%${q}%`).limit(3),
      ])

      const items: SearchResult[] = [
        ...(dogsRes.data || []).map((d: any) => ({
          id: d.id, slug: d.slug, name: d.name, type: 'dog' as const,
          subtitle: d.breed?.name, image: d.thumbnail_url, sex: d.sex,
        })),
        ...(kennelsRes.data || []).map((k: any) => ({
          id: k.id, slug: k.slug, name: k.name, type: 'kennel' as const, image: k.logo_url,
        })),
        ...(breedsRes.data || []).map((b: any) => ({
          id: b.id, name: b.name, type: 'breed' as const,
        })),
      ]

      setResults(items)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function getLink(r: SearchResult) {
    if (r.type === 'dog') return `/dogs/${r.slug || r.id}`
    if (r.type === 'kennel') return `/kennels/${r.slug || r.id}`
    return `/dogs`
  }

  function getIcon(type: string) {
    if (type === 'dog') return Dog
    if (type === 'kennel') return Home
    return Palette
  }

  function getTypeLabel(type: string) {
    if (type === 'dog') return 'Perro'
    if (type === 'kennel') return 'Criadero'
    return 'Raza'
  }

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-mute" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar perros, criaderos, razas..."
          className="w-full bg-chip border border-hair rounded-lg pl-9 pr-16 py-2 text-sm text-white placeholder:text-fg-mute focus:outline-none focus:border-[#D74709]/50 transition"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-fg-mute bg-chip border border-hair rounded px-1.5 py-0.5 font-mono hidden sm:inline">
          Cmd+K
        </kbd>
      </div>

      {/* Dropdown */}
      {open && query.trim().length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-ink-800 border border-hair rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-fg-mute text-sm">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-fg-mute text-sm">Sin resultados para &ldquo;{query}&rdquo;</div>
          ) : (
            <>
              {['dog', 'kennel', 'breed'].map(type => {
                const items = results.filter(r => r.type === type)
                if (items.length === 0) return null
                return (
                  <div key={type}>
                    <div className="px-3 py-1.5 text-[10px] text-fg-mute uppercase tracking-wider font-semibold bg-chip">
                      {getTypeLabel(type)}s
                    </div>
                    {items.map(r => {
                      const Icon = getIcon(r.type)
                      const borderColor = r.sex === 'male' ? BRAND.male : r.sex === 'female' ? BRAND.female : BRAND.primary
                      return (
                        <Link
                          key={`${r.type}-${r.id}`}
                          href={getLink(r)}
                          onClick={() => { setOpen(false); setQuery('') }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-chip transition"
                        >
                          {r.image ? (
                            <div className="w-8 h-8 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor }}>
                              <img src={r.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-chip flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-fg-mute" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">{r.name}</p>
                            {r.subtitle && <p className="text-xs text-fg-mute truncate">{r.subtitle}</p>}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
