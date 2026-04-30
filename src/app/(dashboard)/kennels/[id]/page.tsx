import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Calendar, Dog, ExternalLink, Heart, Tag, Baby, ShieldCheck } from 'lucide-react'
import WhatsAppIcon from '@/components/ui/whatsapp-icon'
import { BRAND } from '@/lib/constants'
import { isUUID } from '@/lib/slug'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase.from('kennels').select('name, slug, logo_url, description, country, city').eq(field, id).single()
  if (!kennel) return { title: 'Criadero no encontrado — Genealogic' }

  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const description = kennel.description?.substring(0, 160) || `Criadero ${kennel.name}${location ? ' en ' + location : ''} | Genealogic`
  const image = kennel.logo_url || 'https://genealogic.io/icon.svg'
  const canonical = `https://genealogic.io/kennels/${kennel.slug || id}`

  return {
    title: `${kennel.name} — Criadero | Genealogic`,
    description,
    alternates: { canonical },
    openGraph: { title: kennel.name, description, url: canonical, images: [{ url: image, alt: kennel.name }], type: 'website', siteName: 'Genealogic' },
    twitter: { card: 'summary_large_image', title: kennel.name, description, images: [image] },
  }
}

export default async function KennelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('*')
    .eq(field, id)
    .single()

  if (!kennel) notFound()

  // Fetch kennel dogs (all visible unless explicitly hidden)
  const { data: allDogs } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, is_verified, is_reproductive, is_for_sale, sale_price, sale_currency, sale_location, breed:breeds(name)')
    .eq('kennel_id', kennel.id)
    .or('show_in_kennel.is.null,show_in_kennel.eq.true')
    .order('name')

  // Fetch public litters with parents and breed
  const { data: allLitters } = await supabase
    .from('litters')
    .select('id, status, birth_date, mating_date, breed:breeds(name), father:dogs!litters_father_id_fkey(id, name, thumbnail_url), mother:dogs!litters_mother_id_fkey(id, name, thumbnail_url)')
    .eq('owner_id', kennel.owner_id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const dogs = allDogs || []
  const litters = allLitters || []
  const forSale = dogs.filter((d: any) => d.is_for_sale)
  const reproductores = dogs.filter((d: any) => d.is_reproductive && !d.is_for_sale)
  const criados = dogs.filter((d: any) => !d.is_reproductive && !d.is_for_sale)

  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$', COP: '$', ARS: '$', CLP: '$' }

  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: kennel.name,
    description: kennel.description || `Criadero ${kennel.name}${location ? ' en ' + location : ''}`,
    url: `https://genealogic.io/kennels/${kennel.slug || id}`,
    ...(kennel.logo_url && { logo: kennel.logo_url }),
    ...(kennel.website && { sameAs: [kennel.website] }),
    ...(location && { address: { '@type': 'PostalAddress', addressLocality: kennel.city, addressCountry: kennel.country } }),
    ...(kennel.foundation_date && { foundingDate: kennel.foundation_date }),
    numberOfEmployees: dogs.length,
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex items-center gap-4 mb-6">
        <Link href={user?.id === kennel.owner_id ? '/kennel' : '/kennels'} className="text-fg-mute hover:text-fg transition"><ArrowLeft className="w-5 h-5" /></Link>
      </div>

      {/* Kennel banner */}
      <div className="relative bg-gradient-to-r from-[#D74709]/20 to-[#D74709]/5 border border-hair rounded-2xl overflow-hidden mb-8">
        <div className="px-6 py-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-chip flex items-center justify-center flex-shrink-0">
            {kennel.logo_url ? <img src={kennel.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-fg-mute">{kennel.name[0]}</span>}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{kennel.name}</h1>
            {kennel.description && <p className="text-sm text-fg-dim mt-1 line-clamp-2">{kennel.description}</p>}
            <div className="flex flex-wrap gap-4 mt-3">
              {kennel.foundation_date && <span className="flex items-center gap-1.5 text-xs text-fg-mute"><Calendar className="w-3.5 h-3.5" /> Fundado en {new Date(kennel.foundation_date).getFullYear()}</span>}
              {kennel.website && <a href={kennel.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-fg-mute hover:text-[#D74709] transition"><Globe className="w-3.5 h-3.5" /> Web</a>}
              {kennel.social_instagram && <a href={kennel.social_instagram} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-fg-mute hover:text-pink-400 transition"><ExternalLink className="w-3.5 h-3.5" /> Instagram</a>}
              {kennel.social_facebook && <a href={kennel.social_facebook} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs text-fg-mute hover:text-blue-400 transition"><ExternalLink className="w-3.5 h-3.5" /> Facebook</a>}
              {kennel.whatsapp_enabled && kennel.whatsapp_phone && (
                <a href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || '')}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full hover:bg-green-500/20 transition">
                  <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1. En venta */}
      {forSale.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-[#D74709]" />
            <h2 className="text-lg font-semibold">En venta</h2>
            <span className="text-xs text-fg-mute bg-chip rounded-full px-2 py-0.5">{forSale.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {forSale.map((dog: any) => (
              <SaleDogCard key={dog.id} dog={dog} currencySymbol={currencySymbol} />
            ))}
          </div>
        </section>
      )}

      {/* 2. Camadas publicas */}
      {litters.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Baby className="w-4 h-4 text-purple-400" />
            <h2 className="text-lg font-semibold">Proximas camadas</h2>
            <span className="text-xs text-fg-mute bg-chip rounded-full px-2 py-0.5">{litters.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {litters.map((litter: any) => {
              const father = litter.father
              const mother = litter.mother
              const breedName = litter.breed?.name
              const title = father && mother ? `${father.name} x ${mother.name}` : father?.name || mother?.name || 'Camada'
              return (
                <Link key={litter.id} href={`/litters/${litter.id}`}
                  className="bg-ink-800 border border-hair rounded-xl overflow-hidden hover:border-purple-400/30 transition">
                  {/* Parent photos */}
                  <div className="flex h-24 bg-chip">
                    <div className="flex-1 relative">
                      {father?.thumbnail_url ? <img src={father.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-400/30 text-lg">♂</div>}
                    </div>
                    <div className="w-px bg-chip" />
                    <div className="flex-1 relative">
                      {mother?.thumbnail_url ? <img src={mother.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-pink-400/30 text-lg">♀</div>}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold truncate">{title}</p>
                    {breedName && <p className="text-[10px] text-fg-mute mt-0.5">{breedName}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        litter.status === 'born' || litter.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                        litter.status === 'mated' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {litter.status === 'born' || litter.status === 'confirmed' ? 'Nacida' : litter.status === 'mated' ? 'Cubricion' : 'Planificada'}
                      </span>
                      {litter.birth_date && <span className="text-[10px] text-fg-mute">{new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 3. Reproductores */}
      {reproductores.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-pink-400" />
            <h2 className="text-lg font-semibold">Reproductores</h2>
            <span className="text-xs text-fg-mute bg-chip rounded-full px-2 py-0.5">{reproductores.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {reproductores.map((dog: any) => <PublicDogCard key={dog.id} dog={dog} />)}
          </div>
        </section>
      )}

      {/* 4. Criados por el criadero */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Dog className="w-4 h-4 text-[#D74709]" />
          <h2 className="text-lg font-semibold">Criados por {kennel.name}</h2>
          <span className="text-xs text-fg-mute bg-chip rounded-full px-2 py-0.5">{criados.length}</span>
        </div>
        {criados.length === 0 && forSale.length === 0 && reproductores.length === 0 ? (
          <div className="text-center py-12 bg-chip border border-hair rounded-xl text-fg-mute">No hay perros visibles en este criadero</div>
        ) : criados.length === 0 ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {criados.map((dog: any) => <PublicDogCard key={dog.id} dog={dog} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function SaleDogCard({ dog, currencySymbol }: { dog: any; currencySymbol: Record<string, string> }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const symbol = currencySymbol[dog.sale_currency] || '€'
  return (
    <Link href={`/dogs/${dog.slug || dog.id}`} className="bg-ink-800 border border-[#D74709]/20 rounded-xl overflow-hidden hover:border-[#D74709]/50 transition group relative">
      <div className="absolute top-2 left-2 z-10 bg-[#D74709] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
        <Tag className="w-2.5 h-2.5" /> EN VENTA
      </div>
      <div className="relative aspect-square bg-chip">
        {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Dog className="w-10 h-10 text-fg-mute" /></div>}
        {dog.breed?.name && <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">{dog.breed.name}</span>}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </div>
      <div className="p-2.5">
        <p className="text-sm font-semibold truncate group-hover:text-[#D74709] transition">{dog.name}</p>
        <div className="flex items-center justify-between mt-1">
          {dog.sale_price ? (
            <p className="text-sm font-bold text-[#D74709]">{Number(dog.sale_price).toLocaleString('es-ES')} {symbol}</p>
          ) : (
            <p className="text-xs text-fg-mute">Consultar precio</p>
          )}
          {dog.sale_location && <p className="text-[10px] text-fg-mute truncate ml-2">{dog.sale_location}</p>}
        </div>
      </div>
    </Link>
  )
}

function PublicDogCard({ dog }: { dog: any }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const sexIcon = dog.sex === 'male' ? '♂' : '♀'
  return (
    <Link href={`/dogs/${dog.slug || dog.id}`} className="bg-ink-800 border border-hair rounded-xl overflow-hidden hover:border-[#D74709]/30 transition group">
      <div className="relative aspect-square bg-chip">
        {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Dog className="w-10 h-10 text-fg-mute" /></div>}
        {dog.breed?.name && <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">{dog.breed.name}</span>}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </div>
      <div className="p-2.5">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold truncate group-hover:text-[#D74709] transition">{dog.name}</p>
          {(dog as any).is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
        </div>
        {dog.breed?.name && <p className="text-[11px] text-fg-mute truncate">{dog.breed.name}</p>}
      </div>
    </Link>
  )
}
