'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Edit, Globe, Calendar, Dog, Camera, Search, Grid3X3, List, Eye, EyeOff,
  Loader2, ExternalLink, MessageCircle, Settings, Baby
} from 'lucide-react'
import KennelEditPanel from './kennel-edit-panel'

interface Props {
  kennel: any
  dogs: any[]
  litters: any[]
  userId: string
}

export default function KennelDashboard({ kennel, dogs: initialDogs, litters, userId }: Props) {
  const router = useRouter()
  const [dogs, setDogs] = useState(initialDogs)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showEdit, setShowEdit] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = dogs.filter((d: any) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: dogs.length,
    public: dogs.filter((d: any) => d.is_public).length,
    litters: litters.length,
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const path = `${kennel.id}/logo.webp`

    // Convert to webp via canvas
    const img = new Image()
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext('2d')!
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400)

      canvas.toBlob(async (blob) => {
        if (!blob) { setUploading(false); return }
        await supabase.storage.from('kennels').upload(path, blob, { contentType: 'image/webp', upsert: true })
        const { data: pub } = supabase.storage.from('kennels').getPublicUrl(path)
        const url = pub.publicUrl + '?t=' + Date.now()
        await supabase.from('kennels').update({ logo_url: url }).eq('id', kennel.id)
        setUploading(false)
        router.refresh()
      }, 'image/webp', 0.85)
    }
    img.src = URL.createObjectURL(file)
    e.target.value = ''
  }

  async function toggleDogVisibility(dogId: string, current: boolean) {
    const supabase = createClient()
    const newVal = !current
    await supabase.from('dogs').update({ is_public: newVal }).eq('id', dogId)
    setDogs(prev => prev.map((d: any) => d.id === dogId ? { ...d, is_public: newVal } : d))
  }

  return (
    <div>
      {/* Header banner */}
      <div className="relative bg-gradient-to-r from-[#D74709]/20 to-[#D74709]/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-6 flex items-center gap-5">
          {/* Logo */}
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center group flex-shrink-0"
          >
            {kennel.logo_url ? (
              <img src={kennel.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-white/20">{kennel.name[0]}</span>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold truncate">{kennel.name}</h1>
              <button onClick={() => setShowEdit(true)} className="text-white/40 hover:text-[#D74709] transition" title="Editar criadero">
                <Settings className="w-5 h-5" />
              </button>
            </div>
            {kennel.description && <p className="text-sm text-white/50 line-clamp-2 mb-2">{kennel.description}</p>}
            <div className="flex flex-wrap gap-4">
              {kennel.foundation_date && (
                <span className="flex items-center gap-1.5 text-xs text-white/40">
                  <Calendar className="w-3.5 h-3.5" /> Fundado en {new Date(kennel.foundation_date).getFullYear()}
                </span>
              )}
              {kennel.website && (
                <a href={kennel.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#D74709] transition">
                  <Globe className="w-3.5 h-3.5" /> Sitio web
                </a>
              )}
              {kennel.social_instagram && (
                <a href={kennel.social_instagram} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-pink-400 transition">
                  <ExternalLink className="w-3.5 h-3.5" /> Instagram
                </a>
              )}
              {kennel.social_facebook && (
                <a href={kennel.social_facebook} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-blue-400 transition">
                  <ExternalLink className="w-3.5 h-3.5" /> Facebook
                </a>
              )}
              {kennel.social_youtube && (
                <a href={kennel.social_youtube} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 transition">
                  <ExternalLink className="w-3.5 h-3.5" /> YouTube
                </a>
              )}
              {kennel.whatsapp_enabled && kennel.whatsapp_phone && (
                <a href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || '')}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-green-400 transition">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] text-white/40 uppercase">Perros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.public}</p>
              <p className="text-[10px] text-white/40 uppercase">Publicos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.litters}</p>
              <p className="text-[10px] text-white/40 uppercase">Camadas</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-6 py-3 bg-white/[0.03] border-t border-white/5 flex items-center gap-3">
          <button onClick={() => setShowEdit(true)} className="text-xs text-white/50 hover:text-[#D74709] flex items-center gap-1.5 transition">
            <Edit className="w-3.5 h-3.5" /> Editar perfil
          </button>
          <span className="text-white/10">|</span>
          <Link href={`/kennels/${kennel.id}`} className="text-xs text-white/50 hover:text-[#D74709] flex items-center gap-1.5 transition">
            <ExternalLink className="w-3.5 h-3.5" /> Ver perfil publico
          </Link>
          <span className="text-white/10">|</span>
          <Link href="/dogs" className="text-xs text-white/50 hover:text-[#D74709] flex items-center gap-1.5 transition">
            <Dog className="w-3.5 h-3.5" /> Todos mis perros
          </Link>
          <span className="text-white/10">|</span>
          <Link href="/litters" className="text-xs text-white/50 hover:text-[#D74709] flex items-center gap-1.5 transition">
            <Baby className="w-3.5 h-3.5" /> Mis camadas
          </Link>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Perros del criadero</h2>
          <span className="text-xs text-white/30 bg-white/5 rounded-full px-2.5 py-0.5">{filtered.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar perro..."
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition w-48"
            />
          </div>
          {/* View toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#D74709] text-white' : 'text-white/40 hover:text-white'}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-[#D74709] text-white' : 'text-white/40 hover:text-white'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dogs grid/list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
          <Dog className="w-12 h-12 text-white/15 mx-auto mb-3" />
          <p className="text-white/40">{search ? 'Sin resultados' : 'No hay perros en este criadero'}</p>
          {!search && (
            <Link href="/dogs" className="text-sm text-[#D74709] hover:underline mt-2 inline-block">
              Ir a mis perros
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dog: any) => (
            <DogCard key={dog.id} dog={dog} onToggleVisibility={toggleDogVisibility} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((dog: any) => (
            <DogRow key={dog.id} dog={dog} onToggleVisibility={toggleDogVisibility} />
          ))}
        </div>
      )}

      {/* Edit panel */}
      <KennelEditPanel open={showEdit} onClose={() => setShowEdit(false)} kennel={kennel} />
    </div>
  )
}

function DogCard({ dog, onToggleVisibility }: { dog: any; onToggleVisibility: (id: string, current: boolean) => void }) {
  const sexColor = dog.sex === 'male' ? '#017DFA' : '#e84393'
  const sexIcon = dog.sex === 'male' ? '♂' : '♀'
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden hover:border-[#D74709]/30 transition group">
      {/* Photo */}
      <Link href={`/dogs/${dog.id}`} className="block relative aspect-[4/3] bg-white/5">
        {dog.thumbnail_url ? (
          <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dog className="w-12 h-12 text-white/10" />
          </div>
        )}
        {/* Breed badge */}
        {dog.breed?.name && (
          <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {dog.breed.name}
          </span>
        )}
        {/* Sex indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </Link>

      {/* Info */}
      <div className="p-3">
        <Link href={`/dogs/${dog.id}`} className="flex items-center gap-1.5 group-hover:text-[#D74709] transition">
          <span className="text-sm font-semibold truncate">{dog.name}</span>
          <span className="text-xs" style={{ color: sexColor }}>{sexIcon}</span>
        </Link>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/35">
          {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
          {dog.color?.name && <span>{dog.color.name}</span>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={() => onToggleVisibility(dog.id, dog.is_public)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition ${
              dog.is_public
                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                : 'bg-white/5 text-white/30 hover:bg-white/10'
            }`}
            title={dog.is_public ? 'Visible publicamente' : 'Oculto'}
          >
            {dog.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {dog.is_public ? 'Publico' : 'Oculto'}
          </button>
          <Link
            href={`/dogs/${dog.id}`}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50 transition ml-auto"
          >
            <Edit className="w-3 h-3" /> Editar
          </Link>
        </div>
      </div>
    </div>
  )
}

function DogRow({ dog, onToggleVisibility }: { dog: any; onToggleVisibility: (id: string, current: boolean) => void }) {
  const sexColor = dog.sex === 'male' ? '#017DFA' : '#e84393'
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 flex items-center gap-4 hover:border-[#D74709]/30 transition">
      <Link href={`/dogs/${dog.id}`} className="flex-shrink-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border-2" style={{ borderColor: sexColor }}>
          {dog.thumbnail_url ? (
            <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Dog className="w-5 h-5 text-white/15" /></div>
          )}
        </div>
      </Link>
      <Link href={`/dogs/${dog.id}`} className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate hover:text-[#D74709] transition">{dog.name}</p>
        <p className="text-[11px] text-white/35 truncate">
          {dog.breed?.name}{dog.color?.name ? ` · ${dog.color.name}` : ''}{dog.birth_date ? ` · ${new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
        </p>
      </Link>
      <button
        onClick={() => onToggleVisibility(dog.id, dog.is_public)}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition flex-shrink-0 ${
          dog.is_public
            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
            : 'bg-white/5 text-white/30 hover:bg-white/10'
        }`}
      >
        {dog.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {dog.is_public ? 'Publico' : 'Oculto'}
      </button>
      <Link href={`/dogs/${dog.id}`} className="text-white/30 hover:text-[#D74709] transition flex-shrink-0">
        <Edit className="w-4 h-4" />
      </Link>
    </div>
  )
}
