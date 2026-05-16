'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Edit, Globe, Calendar, Dog, Camera, Search, Grid3X3, List, Eye, EyeOff,
  Loader2, ExternalLink, Settings, Baby, Heart, ArrowRightLeft, Tag,
} from 'lucide-react'
import WhatsAppIcon from '@/components/ui/whatsapp-icon'
import SortSelect, { useSortPreference, sortItems } from '@/components/ui/sort-select'
import KennelEditPanel from './kennel-edit-panel'
import TransferPanel from './transfer-panel'
import SalePanel from './sale-panel'

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('kennel-view') as 'grid' | 'list') || 'grid'
    return 'grid'
  })
  const changeView = (v: 'grid' | 'list') => { setViewMode(v); localStorage.setItem('kennel-view', v) }
  const [sortBy, setSortBy] = useSortPreference('kennel-sort')
  const [showEdit, setShowEdit] = useState(false)
  const [transferDog, setTransferDog] = useState<any>(null)
  const [saleDog, setSaleDog] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = sortItems(
    dogs.filter((d: any) => d.name.toLowerCase().includes(search.toLowerCase())),
    sortBy,
  )

  const stats = [
    { label: 'Perros', value: dogs.length, color: '#fb923c' },
    { label: 'Visibles', value: dogs.filter((d: any) => d.show_in_kennel !== false).length, color: '#34d399' },
    { label: 'Reproductores', value: dogs.filter((d: any) => d.is_reproductive).length, color: '#ec4899' },
    { label: 'Camadas', value: litters.length, color: '#8b5cf6' },
  ]

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const path = `${kennel.id}/logo.webp`

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

  async function toggleField(dogId: string, field: string, current: boolean) {
    const supabase = createClient()
    const newVal = !current
    await supabase.from('dogs').update({ [field]: newVal }).eq('id', dogId)
    setDogs(prev => prev.map((d: any) => d.id === dogId ? { ...d, [field]: newVal } : d))
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header card — Cal puro: canvas + hairline */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          {/* Logo */}
          <button
            onClick={() => fileRef.current?.click()}
            className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-card sm:h-28 sm:w-28"
          >
            {kennel.logo_url ? (
              <img src={kennel.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-4xl font-semibold text-muted">{kennel.name[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Criadero</p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="truncate text-[28px] sm:text-[36px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
                {kennel.name}
              </h1>
              <button
                onClick={() => setShowEdit(true)}
                title="Editar criadero"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-soft hover:text-ink"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
            {kennel.description && (
              <p className="mt-2 line-clamp-2 max-w-prose text-[14px] text-body">{kennel.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              {kennel.foundation_date && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <Calendar className="h-3.5 w-3.5" /> Fundado en {new Date(kennel.foundation_date).getFullYear()}
                </span>
              )}
              {kennel.website && (
                <a href={kennel.website} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] text-body transition-colors hover:text-ink">
                  <Globe className="h-3.5 w-3.5" /> Sitio web
                </a>
              )}
              {kennel.social_instagram && (
                <a href={kennel.social_instagram} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] text-body transition-colors hover:text-ink">
                  <ExternalLink className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
              {kennel.social_facebook && (
                <a href={kennel.social_facebook} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] text-body transition-colors hover:text-ink">
                  <ExternalLink className="h-3.5 w-3.5" /> Facebook
                </a>
              )}
              {kennel.social_youtube && (
                <a href={kennel.social_youtube} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] text-body transition-colors hover:text-ink">
                  <ExternalLink className="h-3.5 w-3.5" /> YouTube
                </a>
              )}
              {kennel.whatsapp_enabled && kennel.whatsapp_phone && (
                <a
                  href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || '')}`}
                  target="_blank" rel="noopener"
                  className="inline-flex items-center gap-1.5 text-[12px] text-body transition-colors hover:text-ink"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 border-t border-hairline">
          {stats.map((s, i) => (
            <div key={s.label} className={`px-4 py-4 ${i < stats.length - 1 ? 'border-r border-hairline' : ''}`}>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{s.label}</span>
              </div>
              <p className="mt-1 text-[24px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-hairline bg-surface-soft px-4 py-2.5 sm:px-6">
          <QuickAction icon={Edit} label="Editar perfil" onClick={() => setShowEdit(true)} />
          <Divider />
          <QuickAction icon={ExternalLink} label="Ver perfil público" href={`/kennels/${kennel.id}`} />
          <Divider />
          <QuickAction icon={Dog} label="Todos mis perros" href="/dogs" />
          <Divider />
          <QuickAction icon={Baby} label="Mis camadas" href="/litters" />
        </div>
      </div>

      {/* Controls bar */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">Perros del criadero</h2>
            <span className="inline-flex h-6 items-center rounded-full bg-surface-card px-2.5 text-[11px] font-medium text-body">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar perro..."
                className="w-full rounded-lg border border-hairline bg-canvas py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition sm:w-56"
              />
            </div>
            <SortSelect value={sortBy} onChange={setSortBy} storageKey="kennel-sort" />
            <div className="flex overflow-hidden rounded-lg border border-hairline">
              <button
                onClick={() => changeView('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-ink text-on-primary' : 'bg-canvas text-muted hover:bg-surface-soft hover:text-ink'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => changeView('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-ink text-on-primary' : 'bg-canvas text-muted hover:bg-surface-soft hover:text-ink'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dogs grid/list */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
            <Dog className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-3 text-[14px] text-body">
              {search ? 'Sin resultados para esa búsqueda.' : 'No hay perros en este criadero.'}
            </p>
            {!search && (
              <Link href="/dogs" className="mt-3 inline-block text-[13px] font-medium text-ink hover:opacity-80">
                Ir a mis perros →
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((dog: any) => (
              <KennelDogCard key={dog.id} dog={dog} userId={userId} onToggle={toggleField} onTransfer={d => setTransferDog(d)} onSale={d => setSaleDog(d)} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((dog: any) => (
              <KennelDogRow key={dog.id} dog={dog} userId={userId} onToggle={toggleField} onTransfer={d => setTransferDog(d)} onSale={d => setSaleDog(d)} />
            ))}
          </div>
        )}
      </div>

      {/* Panels */}
      <KennelEditPanel open={showEdit} onClose={() => setShowEdit(false)} kennel={kennel} />
      <SalePanel open={!!saleDog} onClose={() => setSaleDog(null)} dog={saleDog} />
      <TransferPanel open={!!transferDog} onClose={() => setTransferDog(null)} dog={transferDog} kennelName={kennel.name} />
    </div>
  )
}

function QuickAction({ icon: Icon, label, href, onClick }: { icon: any; label: string; href?: string; onClick?: () => void }) {
  const className = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-medium text-body transition-colors hover:bg-canvas hover:text-ink'
  if (href) {
    return <Link href={href} className={className}><Icon className="h-3.5 w-3.5" /> {label}</Link>
  }
  return <button onClick={onClick} className={className}><Icon className="h-3.5 w-3.5" /> {label}</button>
}

function Divider() {
  return <span className="text-muted">·</span>
}

function KennelDogCard({ dog, userId, onToggle, onTransfer, onSale }: {
  dog: any; userId: string;
  onToggle: (id: string, field: string, current: boolean) => void;
  onTransfer: (d: any) => void; onSale: (d: any) => void;
}) {
  const sexColor = dog.sex === 'male' ? '#017DFA' : '#e84393'
  const isOwner = dog.owner_id === userId
  const isTransferred = !isOwner
  const visible = dog.show_in_kennel !== false
  return (
    <div className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft">
      <Link href={`/dogs/${dog.slug || dog.id}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-card">
        {dog.thumbnail_url
          ? <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="flex h-full w-full items-center justify-center"><Dog className="h-12 w-12 text-muted" /></div>
        }
        {dog.breed?.name && (
          <span className="absolute right-2 top-2 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {dog.breed.name}
          </span>
        )}
        {isTransferred && (
          <span className="absolute left-2 top-2 rounded-full bg-[#8b5cf6] px-2 py-0.5 text-[10.5px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
            Transferido
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </Link>
      <div className="p-3">
        <Link href={`/dogs/${dog.slug || dog.id}`} className="block">
          <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted">
          {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
          {dog.color?.name && <span>· {dog.color.name}</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-hairline pt-3">
          <ToggleChip
            active={visible}
            onClick={() => onToggle(dog.id, 'show_in_kennel', visible)}
            activeColor="#34d399"
            icon={visible ? Eye : EyeOff}
            label="Visible"
          />
          <ToggleChip
            active={!!dog.is_reproductive}
            onClick={() => onToggle(dog.id, 'is_reproductive', !!dog.is_reproductive)}
            activeColor="#ec4899"
            icon={Heart}
            label="Reproductor"
          />
          {isOwner && (
            <ToggleChip
              active={!!dog.is_for_sale}
              onClick={() => onSale({ id: dog.id, name: dog.name, thumbnail_url: dog.thumbnail_url, breed_name: dog.breed?.name })}
              activeColor="#f59e0b"
              icon={Tag}
              label={dog.is_for_sale ? 'En venta' : 'Vender'}
            />
          )}
          {isOwner && (
            <button
              onClick={() => onTransfer({ id: dog.id, name: dog.name, thumbnail_url: dog.thumbnail_url, breed_name: dog.breed?.name })}
              title="Transferir"
              className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-soft hover:text-ink"
            >
              <ArrowRightLeft className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleChip({ active, onClick, activeColor, icon: Icon, label }: { active: boolean; onClick: () => void; activeColor: string; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-medium transition-colors ${
        active ? 'text-white' : 'border border-hairline bg-canvas text-muted hover:text-ink'
      }`}
      style={active ? { backgroundColor: activeColor } : undefined}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  )
}

function KennelDogRow({ dog, userId, onToggle, onTransfer, onSale }: {
  dog: any; userId: string;
  onToggle: (id: string, field: string, current: boolean) => void;
  onTransfer: (d: any) => void; onSale: (d: any) => void;
}) {
  const sexColor = dog.sex === 'male' ? '#017DFA' : '#e84393'
  const isOwner = dog.owner_id === userId
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-3 transition-colors hover:bg-surface-soft sm:gap-4 sm:p-4">
      <Link href={`/dogs/${dog.slug || dog.id}`} className="flex-shrink-0">
        <div className="h-10 w-10 overflow-hidden rounded-full border-2 bg-surface-card" style={{ borderColor: sexColor }}>
          {dog.thumbnail_url
            ? <img src={dog.thumbnail_url} alt="" className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center"><Dog className="h-4 w-4 text-muted" /></div>
          }
        </div>
      </Link>
      <Link href={`/dogs/${dog.slug || dog.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
          {!isOwner && (
            <span className="rounded-full bg-[#8b5cf6]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#8b5cf6]">Transferido</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
          {dog.breed?.name && <span>{dog.breed.name}</span>}
          {dog.color?.name && <span>· {dog.color.name}</span>}
        </div>
      </Link>
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          onClick={() => onToggle(dog.id, 'show_in_kennel', dog.show_in_kennel !== false)}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            dog.show_in_kennel !== false ? 'bg-[#34d399] text-white' : 'border border-hairline bg-canvas text-muted hover:text-ink'
          }`}
          title="Visible en perfil público"
        >
          {dog.show_in_kennel !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
        <button
          onClick={() => onToggle(dog.id, 'is_reproductive', !!dog.is_reproductive)}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            dog.is_reproductive ? 'bg-[#ec4899] text-white' : 'border border-hairline bg-canvas text-muted hover:text-ink'
          }`}
          title="Reproductor"
        >
          <Heart className="h-3 w-3" />
        </button>
        {isOwner && (
          <button
            onClick={() => onSale({ id: dog.id, name: dog.name, thumbnail_url: dog.thumbnail_url, breed_name: dog.breed?.name })}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              dog.is_for_sale ? 'bg-[#f59e0b] text-white' : 'border border-hairline bg-canvas text-muted hover:text-ink'
            }`}
            title={dog.is_for_sale ? 'Editar anuncio' : 'Poner en venta'}
          >
            <Tag className="h-3 w-3" />
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => onTransfer({ id: dog.id, name: dog.name, thumbnail_url: dog.thumbnail_url, breed_name: dog.breed?.name })}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-soft hover:text-ink"
            title="Transferir"
          >
            <ArrowRightLeft className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
