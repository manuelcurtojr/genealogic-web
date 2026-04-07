'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Dog, Filter, X, Tag, MapPin } from 'lucide-react'
import { BRAND } from '@/lib/constants'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [breeds, setBreeds] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Filters
  const [breedFilter, setBreedFilter] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [forSaleOnly, setForSaleOnly] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('breeds').select('id, name').order('name').then(({ data }) => setBreeds(data || []))
  }, [])

  async function handleSearch() {
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
  }

  useEffect(() => {
    handleSearch()
  }, [breedFilter, sexFilter, forSaleOnly])

  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$' }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Buscar perros</h1>
      <p className="text-white/40 text-sm mb-6">Encuentra perros de raza, reproductores y cachorros disponibles</p>

      {/* Search bar + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por nombre..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
        </div>
        <select value={breedFilter} onChange={e => setBreedFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none">
          <option value="">Todas las razas</option>
          {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={sexFilter} onChange={e => setSexFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none">
          <option value="">Ambos sexos</option>
          <option value="male">♂ Macho</option>
          <option value="female">♀ Hembra</option>
        </select>
        <button onClick={() => setForSaleOnly(!forSaleOnly)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition ${forSaleOnly ? 'bg-[#D74709]/15 text-[#D74709] border-[#D74709]/30' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
          <Tag className="w-4 h-4" /> En venta
        </button>
        <button onClick={handleSearch}
          className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
          Buscar
        </button>
      </div>

      {/* Results count */}
      {loaded && <p className="text-xs text-white/30 mb-4">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>}

      {/* Results grid */}
      {loading ? (
        <div className="text-center py-20 text-white/30">Buscando...</div>
      ) : results.length === 0 && loaded ? (
        <div className="text-center py-20">
          <Dog className="w-16 h-16 text-white/15 mx-auto mb-4" />
          <p className="text-white/40">No se encontraron resultados</p>
          <p className="text-xs text-white/25 mt-1">Prueba con otros filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((dog: any) => {
            const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
            const sexIcon = dog.sex === 'male' ? '♂' : '♀'
            const breedName = dog.breed?.name
            const kennelName = dog.kennel?.name
            const symbol = currencySymbol[dog.sale_currency] || '€'

            return (
              <Link key={dog.id} href={`/dogs/${dog.id}`}
                className={`bg-white/[0.04] border rounded-xl overflow-hidden hover:border-[#D74709]/30 transition group ${dog.is_for_sale ? 'border-[#D74709]/20' : 'border-white/10'}`}>
                {/* Photo */}
                <div className="relative aspect-[4/3] bg-white/5">
                  {dog.thumbnail_url ? (
                    <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Dog className="w-12 h-12 text-white/10" /></div>
                  )}
                  {breedName && <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">{breedName}</span>}
                  {dog.is_for_sale && (
                    <span className="absolute top-2 left-2 bg-[#D74709] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" /> EN VENTA
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
                </div>
                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate group-hover:text-[#D74709] transition">{dog.name}</span>
                    <span className="text-xs" style={{ color: sexColor }}>{sexIcon}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-white/35">
                    {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>}
                    {kennelName && <span className="truncate">{kennelName}</span>}
                  </div>
                  {dog.is_for_sale && (
                    <div className="flex items-center justify-between mt-2">
                      {dog.sale_price ? (
                        <span className="text-sm font-bold text-[#D74709]">{Number(dog.sale_price).toLocaleString('es-ES')} {symbol}</span>
                      ) : (
                        <span className="text-xs text-white/30">Consultar precio</span>
                      )}
                      {dog.sale_location && <span className="text-[10px] text-white/25 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{dog.sale_location}</span>}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
