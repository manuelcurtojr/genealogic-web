'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Dog, Filter, X, Tag, MapPin, Home, ChevronDown, ShieldCheck } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { getLocalizedCountries } from '@/lib/countries'

type Tab = 'dogs' | 'kennels'

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>('dogs')

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Buscar</h1>
      <p className="text-fg-mute text-xs sm:text-sm mb-4 sm:mb-6">Encuentra perros y criaderos registrados</p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-chip rounded-xl mb-4 sm:mb-6 w-fit">
        <button onClick={() => setTab('dogs')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'dogs' ? 'bg-[#D74709] text-white shadow' : 'text-fg-mute hover:text-fg-dim'}`}>
          <Dog className="w-4 h-4" /> Perros
        </button>
        <button onClick={() => setTab('kennels')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'kennels' ? 'bg-[#D74709] text-white shadow' : 'text-fg-mute hover:text-fg-dim'}`}>
          <Home className="w-4 h-4" /> Criaderos
        </button>
      </div>

      {tab === 'dogs' ? <DogsSearch /> : <KennelsSearch />}
    </div>
  )
}

/* ─── Dogs Search (existing) ─── */
function DogsSearch() {
  const [query, setQuery] = useState('')
  const [breeds, setBreeds] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [breedFilter, setBreedFilter] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [forSaleOnly, setForSaleOnly] = useState(false)

  const hasActiveFilters = !!breedFilter || !!sexFilter || forSaleOnly

  useEffect(() => {
    const supabase = createClient()
    supabase.from('breeds').select('id, name').order('name').then(({ data }) => setBreeds(data || []))
  }, [])

  const handleSearch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('dogs')
      .select('id, name, sex, thumbnail_url, birth_date, sale_price, sale_currency, sale_location, is_for_sale, breed:breeds(name), kennel:kennels(name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (query.trim()) q = q.ilike('name', `%${query.trim()}%`)
    if (breedFilter) q = q.eq('breed_id', breedFilter)
    if (sexFilter) q = q.eq('sex', sexFilter)
    if (forSaleOnly) q = q.eq('is_for_sale', true)

    const { data } = await q
    setResults(data || [])
    setLoading(false)
    setLoaded(true)
  }, [query, breedFilter, sexFilter, forSaleOnly])

  useEffect(() => { handleSearch() }, [breedFilter, sexFilter, forSaleOnly])

  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$' }

  return (
    <>
      {/* Search bar + filter toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-mute" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por nombre..."
            className="w-full bg-chip border border-hair rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
        </div>
        <button onClick={() => setFiltersOpen(!filtersOpen)}
          className={`p-2.5 rounded-lg border transition shrink-0 ${hasActiveFilters ? 'bg-[#D74709]/15 text-[#D74709] border-[#D74709]/30' : filtersOpen ? 'bg-chip text-white border-hair-strong' : 'bg-chip text-fg-mute border-hair'}`}>
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible filters */}
      {filtersOpen && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-4 p-3 bg-chip border border-hair rounded-xl">
          <select value={breedFilter} onChange={e => setBreedFilter(e.target.value)}
            className="bg-chip border border-hair rounded-lg px-3 py-2.5 text-sm text-fg focus:border-[#D74709] focus:outline-none transition appearance-none flex-1 min-w-0 sm:min-w-[160px]">
            <option value="">Todas las razas</option>
            {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={sexFilter} onChange={e => setSexFilter(e.target.value)}
            className="bg-chip border border-hair rounded-lg px-3 py-2.5 text-sm text-fg focus:border-[#D74709] focus:outline-none transition appearance-none flex-1 min-w-0 sm:min-w-[130px]">
            <option value="">Ambos sexos</option>
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
          <button onClick={() => setForSaleOnly(!forSaleOnly)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition ${forSaleOnly ? 'bg-[#D74709]/15 text-[#D74709] border-[#D74709]/30' : 'bg-chip text-fg-dim border-hair hover:bg-chip'}`}>
            <Tag className="w-4 h-4" /> En venta
          </button>
          <button onClick={handleSearch}
            className="bg-paper-50 text-ink-900 hover:opacity-90 px-5 py-2.5 rounded-lg text-sm font-semibold transition">
            Buscar
          </button>
        </div>
      )}

      {loaded && <p className="text-xs text-fg-mute mb-4">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>}

      {loading ? (
        <div className="text-center py-20 text-fg-mute">Buscando...</div>
      ) : results.length === 0 && loaded ? (
        <div className="text-center py-20">
          <Dog className="w-16 h-16 text-fg-mute mx-auto mb-4" />
          <p className="text-fg-mute">No se encontraron resultados</p>
          <p className="text-xs text-fg-mute mt-1">Prueba con otros filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          {results.map((dog: any) => {
            const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
            const sexIcon = dog.sex === 'male' ? '♂' : '♀'
            const breedName = dog.breed?.name
            const kennelName = dog.kennel?.name
            const symbol = currencySymbol[dog.sale_currency] || '€'

            return (
              <Link key={dog.id} href={`/dogs/${dog.slug || dog.id}`}
                className={`bg-ink-800 border rounded-xl overflow-hidden hover:border-[#D74709]/30 transition group ${dog.is_for_sale ? 'border-[#D74709]/20' : 'border-hair'}`}>
                <div className="relative aspect-[4/3] bg-chip">
                  {dog.thumbnail_url ? (
                    <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Dog className="w-12 h-12 text-fg-mute" /></div>
                  )}
                  {breedName && <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">{breedName}</span>}
                  {dog.is_for_sale && (
                    <span className="absolute top-2 left-2 bg-[#D74709] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" /> EN VENTA
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
                </div>
                <div className="p-2 sm:p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold truncate group-hover:text-[#D74709] transition">{dog.name}</span>
                    
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-fg-mute">
                    {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>}
                    {kennelName && <span className="truncate">{kennelName}</span>}
                  </div>
                  {dog.is_for_sale && (
                    <div className="flex items-center justify-between mt-2">
                      {dog.sale_price ? (
                        <span className="text-sm font-bold text-[#D74709]">{Number(dog.sale_price).toLocaleString('es-ES')} {symbol}</span>
                      ) : (
                        <span className="text-xs text-fg-mute">Consultar precio</span>
                      )}
                      {dog.sale_location && <span className="text-[10px] text-fg-mute flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{dog.sale_location}</span>}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ─── Kennels Search (new) ─── */
function KennelsSearch() {
  const [query, setQuery] = useState('')
  const [breeds, setBreeds] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Multi-select filters
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([])
  const [countryDropdown, setCountryDropdown] = useState(false)
  const [breedDropdown, setBreedDropdown] = useState(false)
  const [countryQ, setCountryQ] = useState('')
  const [breedQ, setBreedQ] = useState('')

  const countries = getLocalizedCountries()
  const filteredCountries = countryQ ? countries.filter(c => c.name.toLowerCase().includes(countryQ.toLowerCase())) : countries
  const filteredBreedOptions = breedQ ? breeds.filter(b => b.name.toLowerCase().includes(breedQ.toLowerCase())) : breeds
  const hasFilters = selectedCountries.length > 0 || selectedBreeds.length > 0

  useEffect(() => {
    const supabase = createClient()
    supabase.from('breeds').select('id, name').order('name').then(({ data }) => setBreeds(data || []))
  }, [])

  const handleSearch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('kennels')
      .select('id, name, logo_url, description, foundation_date, breed_ids, country, city')
      .order('name')
      .limit(60)

    if (query.trim()) q = q.ilike('name', `%${query.trim()}%`)

    // breed_ids is a UUID array column — filter with overlaps
    if (selectedBreeds.length > 0) q = q.overlaps('breed_ids', selectedBreeds)

    // Country filter — filter by kennel's own country field
    if (selectedCountries.length > 0) q = q.in('country', selectedCountries)

    const { data } = await q
    const filtered = data || []

    setResults(filtered)
    setLoading(false)
    setLoaded(true)
  }, [query, selectedBreeds, selectedCountries])

  useEffect(() => { handleSearch() }, [selectedBreeds, selectedCountries])

  // Close dropdowns on outside click
  useEffect(() => {
    const h = () => { setCountryDropdown(false); setBreedDropdown(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  const toggleCountry = (name: string) => {
    setSelectedCountries(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name])
  }
  const toggleBreed = (id: string) => {
    setSelectedBreeds(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id])
  }

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-mute" />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar criadero por nombre..."
          className="w-full bg-chip border border-hair rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Country multi-select */}
        <div className="relative flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => { setCountryDropdown(!countryDropdown); setBreedDropdown(false); setCountryQ('') }}
            className={`w-full bg-chip border rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 transition text-left ${countryDropdown ? 'border-[#D74709]' : selectedCountries.length > 0 ? 'border-[#D74709]/30' : 'border-hair'}`}>
            <MapPin className="w-3.5 h-3.5 text-fg-mute shrink-0" />
            {selectedCountries.length > 0 ? (
              <span className="truncate flex-1 text-fg">{selectedCountries.length} {selectedCountries.length === 1 ? 'país' : 'países'}</span>
            ) : (
              <span className="truncate flex-1 text-fg-mute">Filtrar por país</span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-fg-mute shrink-0" />
          </button>
          {countryDropdown && (
            <div className="absolute z-40 mt-1 w-full bg-ink-800 border border-hair rounded-lg shadow-xl max-h-56 flex flex-col">
              <div className="p-2 border-b border-hair">
                <input autoFocus value={countryQ} onChange={e => setCountryQ(e.target.value)} placeholder="Buscar país..."
                  className="w-full bg-chip border border-hair rounded pl-3 pr-3 py-1.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredCountries.map(c => {
                  const selected = selectedCountries.includes(c.name)
                  return (
                    <button key={c.code} type="button" onClick={() => toggleCountry(c.name)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${selected ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-fg hover:bg-chip'}`}>
                      <span className="text-base">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      {selected && <X className="w-3 h-3 shrink-0" />}
                    </button>
                  )
                })}
              </div>
              {selectedCountries.length > 0 && (
                <button onClick={() => setSelectedCountries([])} className="px-3 py-2 text-xs text-fg-mute hover:text-fg-dim border-t border-hair text-center">
                  Limpiar selección
                </button>
              )}
            </div>
          )}
        </div>

        {/* Breed multi-select */}
        <div className="relative flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => { setBreedDropdown(!breedDropdown); setCountryDropdown(false); setBreedQ('') }}
            className={`w-full bg-chip border rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 transition text-left ${breedDropdown ? 'border-[#D74709]' : selectedBreeds.length > 0 ? 'border-[#D74709]/30' : 'border-hair'}`}>
            <Dog className="w-3.5 h-3.5 text-fg-mute shrink-0" />
            {selectedBreeds.length > 0 ? (
              <span className="truncate flex-1 text-fg">{selectedBreeds.length} {selectedBreeds.length === 1 ? 'raza' : 'razas'}</span>
            ) : (
              <span className="truncate flex-1 text-fg-mute">Filtrar por raza</span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-fg-mute shrink-0" />
          </button>
          {breedDropdown && (
            <div className="absolute z-40 mt-1 w-full bg-ink-800 border border-hair rounded-lg shadow-xl max-h-56 flex flex-col">
              <div className="p-2 border-b border-hair">
                <input autoFocus value={breedQ} onChange={e => setBreedQ(e.target.value)} placeholder="Buscar raza..."
                  className="w-full bg-chip border border-hair rounded pl-3 pr-3 py-1.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredBreedOptions.map(b => {
                  const selected = selectedBreeds.includes(b.id)
                  return (
                    <button key={b.id} type="button" onClick={() => toggleBreed(b.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${selected ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-fg hover:bg-chip'}`}>
                      <span className="flex-1 truncate">{b.name}</span>
                      {selected && <X className="w-3 h-3 shrink-0" />}
                    </button>
                  )
                })}
              </div>
              {selectedBreeds.length > 0 && (
                <button onClick={() => setSelectedBreeds([])} className="px-3 py-2 text-xs text-fg-mute hover:text-fg-dim border-t border-hair text-center">
                  Limpiar selección
                </button>
              )}
            </div>
          )}
        </div>

        <button onClick={handleSearch}
          className="bg-paper-50 text-ink-900 hover:opacity-90 px-5 py-2.5 rounded-lg text-sm font-semibold transition shrink-0">
          Buscar
        </button>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selectedCountries.map(c => {
            const co = countries.find(x => x.name === c)
            return (
              <button key={c} onClick={() => toggleCountry(c)}
                className="flex items-center gap-1 bg-[#D74709]/10 text-[#D74709] text-xs font-medium px-2.5 py-1 rounded-full hover:bg-[#D74709]/20 transition">
                {co?.flag} {c} <X className="w-3 h-3" />
              </button>
            )
          })}
          {selectedBreeds.map(id => {
            const br = breeds.find(b => b.id === id)
            return (
              <button key={id} onClick={() => toggleBreed(id)}
                className="flex items-center gap-1 bg-[#D74709]/10 text-[#D74709] text-xs font-medium px-2.5 py-1 rounded-full hover:bg-[#D74709]/20 transition">
                {br?.name} <X className="w-3 h-3" />
              </button>
            )
          })}
          <button onClick={() => { setSelectedCountries([]); setSelectedBreeds([]) }}
            className="text-xs text-fg-mute hover:text-fg-dim px-2 py-1 transition">
            Limpiar todo
          </button>
        </div>
      )}

      {loaded && <p className="text-xs text-fg-mute mb-4">{results.length} criadero{results.length !== 1 ? 's' : ''}</p>}

      {loading ? (
        <div className="text-center py-20 text-fg-mute">Buscando...</div>
      ) : results.length === 0 && loaded ? (
        <div className="text-center py-20">
          <Home className="w-16 h-16 text-fg-mute mx-auto mb-4" />
          <p className="text-fg-mute">No se encontraron criaderos</p>
          <p className="text-xs text-fg-mute mt-1">Prueba con otros filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {results.map((kennel: any) => {
            const co = kennel.country ? countries.find(c => c.name === kennel.country) : null
            const kennelBreeds = (kennel.breed_ids || [])
              .map((id: string) => breeds.find(b => b.id === id)?.name)
              .filter(Boolean) as string[]

            return (
              <Link key={kennel.id} href={`/kennels/${kennel.slug || kennel.id}`}
                className="bg-ink-800 border border-hair rounded-xl p-4 sm:p-5 hover:border-[#D74709]/30 hover:bg-chip transition group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#D74709]/10 flex items-center justify-center flex-shrink-0 border border-[#D74709]/20 overflow-hidden">
                    {kennel.logo_url ? (
                      <img src={kennel.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-[#D74709]">{kennel.name[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-[#D74709] transition truncate">{kennel.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-fg-mute">
                      {co && <span className="flex items-center gap-1">{co.flag} {kennel.city ? `${kennel.city}, ${co.name}` : co.name}</span>}
                      {kennel.foundation_date && <span>Desde {new Date(kennel.foundation_date).getFullYear()}</span>}
                    </div>
                  </div>
                </div>
                {kennelBreeds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {kennelBreeds.slice(0, 3).map(name => (
                      <span key={name} className="bg-chip text-fg-dim text-[10px] font-semibold px-2 py-0.5 rounded-full">{name}</span>
                    ))}
                    {kennelBreeds.length > 3 && <span className="text-[10px] text-fg-mute px-1 py-0.5">+{kennelBreeds.length - 3}</span>}
                  </div>
                )}
                {kennel.description && (
                  <p className="text-xs text-fg-mute mt-2 line-clamp-2">{kennel.description}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
