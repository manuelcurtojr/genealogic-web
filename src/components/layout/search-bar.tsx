'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Dog, Store, Tag } from 'lucide-react'
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
  /** Para criaderos: "Ciudad, País". Para razas: "N perros". */
  meta?: string | null
}

// Las queries de 2 letras (de, ca, la…) hacen match con decenas de miles de
// perros vía word_similarity (40k+ filas, ~400ms) y nunca son una búsqueda útil
// de un perro concreto. Exigimos 3 letras para la RPC de perros; criaderos y
// razas (tablas pequeñas) siguen respondiendo desde 2.
const MIN_DOGS = 3
const MIN_ANY = 2

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [dogResults, setDogResults] = useState<SearchResult[]>([])
  const [kennelResults, setKennelResults] = useState<SearchResult[]>([])
  const [breedResults, setBreedResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results: SearchResult[] = [...dogResults, ...kennelResults, ...breedResults]

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

  // Búsqueda con debounce. Cada categoría (perros/criaderos/razas) se pinta EN
  // CUANTO su RPC resuelve — no usamos Promise.all, que bloqueaba todo el
  // dropdown si una RPC iba lenta (ese era el "Buscando..." eterno). Las
  // peticiones obsoletas se cancelan con AbortController para no acumular
  // conexiones colgadas al teclear rápido.
  useEffect(() => {
    const q = query.trim()
    let cancelled = false
    const controller = new AbortController()

    const timer = setTimeout(() => {
      if (q.length < MIN_ANY) {
        setDogResults([]); setKennelResults([]); setBreedResults([]); setSearching(false)
        return
      }
      setSearching(true)
      const supabase = createClient()
      const tasks: PromiseLike<unknown>[] = []

      if (q.length >= MIN_DOGS) {
        tasks.push(
          supabase.rpc('search_dogs_smart', { q, lim: 8 }).abortSignal(controller.signal)
            .then(({ data }: any) => {
              if (cancelled) return
              setDogResults((data || []).map((d: any) => ({
                id: d.id, slug: d.slug, name: d.name, type: 'dog' as const,
                subtitle: d.breed_name, image: d.thumbnail_url, sex: d.sex,
              })))
            }, () => {}),
        )
      } else {
        setDogResults([])
      }

      tasks.push(
        supabase.rpc('search_kennels_smart', { q, lim: 5 }).abortSignal(controller.signal)
          .then(({ data }: any) => {
            if (cancelled) return
            setKennelResults((data || []).map((k: any) => ({
              id: k.id, slug: k.slug, name: k.name, type: 'kennel' as const, image: k.logo_url,
              meta: [k.city, k.country].filter(Boolean).join(', ') || null,
            })))
          }, () => {}),
      )

      tasks.push(
        supabase.rpc('search_breeds_smart', { q, lim: 5 }).abortSignal(controller.signal)
          .then(({ data }: any) => {
            if (cancelled) return
            setBreedResults((data || []).map((b: any) => ({
              id: b.id, slug: b.slug, name: b.name, type: 'breed' as const,
              image: b.sample_thumbnail,
              meta: b.dog_count > 0 ? `${Number(b.dog_count).toLocaleString('es-ES')} perros` : null,
            })))
          }, () => {}),
      )

      Promise.allSettled(tasks).then(() => { if (!cancelled) setSearching(false) })
    }, 200)

    return () => { cancelled = true; controller.abort(); clearTimeout(timer) }
  }, [query])

  function goToSearch() {
    const q = query.trim()
    if (!q) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  function getLink(r: SearchResult) {
    if (r.type === 'dog') return `/dogs/${r.slug || r.id}`
    if (r.type === 'kennel') return `/kennels/${r.slug || r.id}`
    if (r.type === 'breed') return r.slug ? `/razas/${r.slug}` : `/search?breed_id=${r.id}`
    return `/dogs`
  }

  function getIcon(type: string) {
    if (type === 'dog') return Dog
    if (type === 'kennel') return Store
    return Tag
  }

  function getTypeLabel(type: string) {
    if (type === 'dog') return 'Perro'
    if (type === 'kennel') return 'Criadero'
    return 'Raza'
  }

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter') goToSearch() }}
          placeholder="Buscar perros, criaderos, razas..."
          className="w-full bg-canvas border border-hairline rounded-lg pl-9 pr-16 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted bg-surface-card border border-hairline rounded px-1.5 py-0.5 font-mono hidden sm:inline">
          Cmd+K
        </kbd>
      </div>

      {/* Dropdown */}
      {open && query.trim().length >= MIN_ANY && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-surface-card border border-hairline rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            searching ? (
              <div className="p-4 text-center text-muted text-sm">Buscando...</div>
            ) : (
              <div className="p-4 text-center text-muted text-sm">Sin resultados para &ldquo;{query.trim()}&rdquo;</div>
            )
          ) : (
            <>
              {['dog', 'kennel', 'breed'].map(type => {
                const items = results.filter(r => r.type === type)
                if (items.length === 0) return null
                return (
                  <div key={type}>
                    <div className="px-3 py-1.5 text-[10px] text-muted uppercase tracking-wider font-semibold bg-surface-card">
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
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-card transition"
                        >
                          {r.image ? (
                            <div className="w-8 h-8 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor }}>
                              <img src={r.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-muted" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium text-ink">{r.name}</p>
                            {(r.subtitle || r.meta) && (
                              <p className="text-xs text-muted truncate">
                                {r.subtitle || r.meta}
                              </p>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
              {/* Ver todos los resultados en /search */}
              <button
                onClick={goToSearch}
                className="flex w-full items-center gap-2 border-t border-hairline px-3 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-card transition"
              >
                <Search className="h-3.5 w-3.5" /> Ver todos los resultados de &ldquo;{query.trim()}&rdquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
