'use client'

import { useState } from 'react'
import { Search, Home } from 'lucide-react'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

interface Kennel {
  id: string
  slug?: string | null
  name: string
  logo_url: string | null
  description: string | null
  foundation_date: string | null
}

export default function KennelsClient({ kennels }: { kennels: Kennel[] }) {
  const [search, setSearch] = useState('')

  const filtered = kennels.filter(k =>
    k.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-mute" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar criadero..."
          className="w-full bg-chip border border-hair rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-fg-mute focus:outline-none focus:border-[#D74709]/50 transition"
        />
      </div>

      <p className="text-xs text-fg-mute mb-3">{filtered.length} criadero{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-fg-mute">
          <Home className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No se encontraron criaderos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(kennel => (
            <Link
              key={kennel.id}
              href={`/kennels/${kennel.slug || kennel.id}`}
              className="bg-chip border border-hair rounded-xl p-5 hover:bg-chip transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#D74709]/10 flex items-center justify-center flex-shrink-0 border border-[#D74709]/20">
                  {kennel.logo_url ? (
                    <img src={kennel.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-xl font-bold text-[#D74709]">{kennel.name[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-[#D74709] transition truncate">{kennel.name}</p>
                  {kennel.foundation_date && (
                    <p className="text-xs text-fg-mute mt-0.5">Fundado en {new Date(kennel.foundation_date).getFullYear()}</p>
                  )}
                  {kennel.description && (
                    <p className="text-xs text-fg-mute mt-1 line-clamp-2">{kennel.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
