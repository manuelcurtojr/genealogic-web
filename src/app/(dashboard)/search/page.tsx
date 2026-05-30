'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Dog, Home, Tag, ChevronRight } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { DogImage } from '@/components/ui/dog-image'

/**
 * /search — buscador universal (resumen). Una sola página con resultados de
 * los TRES directorios a la vez (perros · criaderos · razas), igual que el
 * dropdown del header pero a pantalla completa. El campo del header y el
 * Enter llevan aquí (?q=). Para ver el listado completo con filtros de cada
 * categoría, "Ver todos" enlaza a su directorio (/perros, /kennels, /razas).
 */
export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') || ''

  const [q, setQ] = useState(initialQ)
  const [submitted, setSubmitted] = useState(initialQ)
  const [dogs, setDogs] = useState<any[]>([])
  const [kennels, setKennels] = useState<any[]>([])
  const [breeds, setBreeds] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Mantener q sincronizado si llega un ?q nuevo (p. ej. navegación desde el header)
  useEffect(() => { setQ(initialQ); setSubmitted(initialQ) }, [initialQ])

  useEffect(() => {
    const query = submitted.trim()
    if (query.length < 2) { setDogs([]); setKennels([]); setBreeds([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    const supabase = createClient()
    Promise.allSettled([
      supabase.rpc('search_dogs_smart', { q: query, lim: 12 }).then(({ data }: any) => { if (!cancelled) setDogs(data || []) }),
      supabase.rpc('search_kennels_smart', { q: query, lim: 8 }).then(({ data }: any) => { if (!cancelled) setKennels(data || []) }),
      supabase.rpc('search_breeds_smart', { q: query, lim: 8 }).then(({ data }: any) => { if (!cancelled) setBreeds(data || []) }),
    ]).then(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [submitted])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = q.trim()
    setSubmitted(v)
    router.replace(v ? `/search?q=${encodeURIComponent(v)}` : '/search')
  }

  const hasQuery = submitted.trim().length >= 2
  const empty = hasQuery && !loading && dogs.length === 0 && kennels.length === 0 && breeds.length === 0

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Descubrimiento</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">Buscar</h1>
        <p className="mt-2 text-[14px] text-body">Perros, criaderos y razas registrados en Genealogic.</p>
      </div>

      {/* Campo de búsqueda */}
      <form onSubmit={onSubmit} className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre de perro, criadero o raza..."
          className="w-full rounded-xl border border-hairline bg-canvas py-3 pl-11 pr-4 text-[15px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
        />
      </form>

      {/* Estado inicial */}
      {!hasQuery && (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <Search className="mx-auto h-9 w-9 text-muted" />
          <p className="mt-3 text-[14px] text-body">Escribe al menos 2 letras para buscar.</p>
          <p className="mt-1 text-[12.5px] text-muted">Busca a la vez entre perros, criaderos y razas.</p>
        </div>
      )}

      {empty && (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <p className="text-[14px] text-body">Sin resultados para &ldquo;{submitted.trim()}&rdquo;.</p>
        </div>
      )}

      {hasQuery && !empty && (
        <div className="space-y-8">
          {/* ── Perros ── */}
          {(loading || dogs.length > 0) && (
            <Section title="Perros" icon={Dog} count={dogs.length} viewAllHref={`/perros?q=${encodeURIComponent(submitted.trim())}`}>
              {dogs.length === 0 ? (
                <p className="text-[13px] text-muted">Buscando…</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {dogs.map((d) => {
                    const sexColor = d.sex === 'male' ? BRAND.male : d.sex === 'female' ? BRAND.female : BRAND.primary
                    return (
                      <Link key={d.id} href={`/dogs/${d.slug || d.id}`} className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft">
                        <div className="relative aspect-[4/3] overflow-hidden bg-surface-card">
                          <DogImage src={d.thumbnail_url} alt={d.name} fill width={0} height={0} sizes="(max-width: 640px) 50vw, 25vw" className="absolute inset-0 h-full w-full" />
                          {d.breed_name && (
                            <span className="absolute right-2 top-2 z-10 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">{d.breed_name}</span>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
                        </div>
                        <div className="p-3">
                          <p className="truncate text-[14px] font-medium text-ink">{d.name}</p>
                          {d.breed_name && <p className="truncate text-[11.5px] text-muted">{d.breed_name}</p>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Section>
          )}

          {/* ── Criaderos ── */}
          {kennels.length > 0 && (
            <Section title="Criaderos" icon={Home} count={kennels.length} viewAllHref="/kennels">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {kennels.map((k) => (
                  <Link key={k.id} href={`/kennels/${k.slug || k.id}`} className="group flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-3.5 transition-colors hover:bg-surface-soft">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-card">
                      {k.logo_url ? <img src={k.logo_url} alt="" className="h-full w-full object-cover" /> : <Home className="h-5 w-5 text-muted" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">{k.name}</p>
                      {(k.city || k.country) && <p className="truncate text-[12px] text-muted">{[k.city, k.country].filter(Boolean).join(', ')}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* ── Razas ── */}
          {breeds.length > 0 && (
            <Section title="Razas" icon={Tag} count={breeds.length} viewAllHref="/razas">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {breeds.map((b) => (
                  <Link key={b.id} href={b.slug ? `/razas/${b.slug}` : '/razas'} className="group flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-3.5 transition-colors hover:bg-surface-soft">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-card">
                      {b.sample_thumbnail ? <img src={b.sample_thumbnail} alt="" className="h-full w-full object-cover" /> : <Tag className="h-5 w-5 text-muted" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">{b.name}</p>
                      {b.dog_count > 0 && <p className="truncate text-[12px] text-muted">{Number(b.dog_count).toLocaleString('es-ES')} perros</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, icon: Icon, count, viewAllHref, children }: { title: string; icon: React.ElementType; count: number; viewAllHref: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted" />
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {count > 0 && <span className="text-[12px] tabular-nums text-muted">{count}</span>}
        </div>
        {count > 0 && (
          <Link href={viewAllHref} className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-ink hover:opacity-70 transition">
            Ver todos <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
