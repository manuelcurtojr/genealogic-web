import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Calendar, Dog, ExternalLink, Heart, Tag, Baby } from 'lucide-react'
import WhatsAppIcon from '@/components/ui/whatsapp-icon'
import { BRAND } from '@/lib/constants'
import { isUUID } from '@/lib/slug'
import { pastelByName } from '@/lib/avatars'
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
  const { data: kennel } = await supabase.from('kennels').select('*').eq(field, id).single()
  if (!kennel) notFound()

  const { data: allDogs } = await supabase
    .from('dogs')
    .select('id, slug, name, sex, thumbnail_url, is_reproductive, is_for_sale, sale_price, sale_currency, sale_location, breed:breeds(name)')
    .eq('kennel_id', kennel.id)
    .or('show_in_kennel.is.null,show_in_kennel.eq.true')
    .order('name')

  const { data: allLitters } = await supabase
    .from('litters')
    .select('id, status, birth_date, mating_date, breed:breeds(name), father:dogs!litters_father_id_fkey(id, name, thumbnail_url), mother:dogs!litters_mother_id_fkey(id, name, thumbnail_url)')
    .eq('owner_id', kennel.owner_id)
    .eq('show_in_kennel', true)
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

  const empty = forSale.length === 0 && litters.length === 0 && reproductores.length === 0 && criados.length === 0

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Back button */}
      <Link
        href={user?.id === kennel.owner_id ? '/kennel' : '/kennels'}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      {/* Kennel header — Cal clean card */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
            {kennel.logo_url ? (
              <img src={kennel.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ backgroundColor: pastelByName(kennel.name) }}
              >
                <span className="text-4xl font-semibold text-white">{kennel.name[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Criadero</p>
            <h1 className="mt-1 text-[28px] sm:text-[36px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
              {kennel.name}
            </h1>
            {kennel.description && (
              <p className="mt-2 max-w-prose text-[14px] text-body line-clamp-3">{kennel.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {kennel.foundation_date && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <Calendar className="h-3.5 w-3.5" /> Fundado en {new Date(kennel.foundation_date).getFullYear()}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">📍 {location}</span>
              )}
              {kennel.website && (
                <a href={kennel.website} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] text-body transition-colors hover:text-ink">
                  <Globe className="h-3.5 w-3.5" /> Web
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
              {kennel.whatsapp_enabled && kennel.whatsapp_phone && (
                <a
                  href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || '')}`}
                  target="_blank" rel="noopener"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {empty && (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <Dog className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">No hay perros visibles en este criadero.</p>
        </div>
      )}

      {/* 1. En venta */}
      {forSale.length > 0 && (
        <Section icon={Tag} iconColor="#f59e0b" title="En venta" count={forSale.length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {forSale.map((dog: any) => <SaleDogCard key={dog.id} dog={dog} currencySymbol={currencySymbol} />)}
          </div>
        </Section>
      )}

      {/* 2. Camadas */}
      {litters.length > 0 && (
        <Section icon={Baby} iconColor="#8b5cf6" title="Próximas camadas" count={litters.length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {litters.map((litter: any) => {
              const father = litter.father
              const mother = litter.mother
              const breedName = litter.breed?.name
              const title = father && mother ? `${father.name} × ${mother.name}` : father?.name || mother?.name || 'Camada'
              const statusCfg: Record<string, { label: string; color: string }> = {
                born: { label: 'Nacida', color: '#34d399' },
                confirmed: { label: 'Nacida', color: '#34d399' },
                mated: { label: 'Cubrición', color: '#f59e0b' },
                planned: { label: 'Planificada', color: '#3b82f6' },
                pending: { label: 'Cubrición', color: '#f59e0b' },
              }
              const cfg = statusCfg[litter.status] || statusCfg.planned
              return (
                <Link key={litter.id} href={`/litters/${litter.id}`} className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft">
                  <div className="flex h-24 bg-surface-card">
                    <div className="relative flex-1 overflow-hidden">
                      {father?.thumbnail_url
                        ? <img src={father.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center text-lg text-muted">♂</div>
                      }
                    </div>
                    <div className="w-px bg-hairline" />
                    <div className="relative flex-1 overflow-hidden">
                      {mother?.thumbnail_url
                        ? <img src={mother.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center text-lg text-muted">♀</div>
                      }
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-[13px] font-medium text-ink">{title}</p>
                    {breedName && <p className="mt-0.5 text-[11px] text-muted">{breedName}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium text-white"
                        style={{ backgroundColor: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      {litter.birth_date && (
                        <span className="text-[11px] text-muted">
                          {new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Section>
      )}

      {/* 3. Reproductores */}
      {reproductores.length > 0 && (
        <Section icon={Heart} iconColor="#ec4899" title="Reproductores" count={reproductores.length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {reproductores.map((dog: any) => <PublicDogCard key={dog.id} dog={dog} />)}
          </div>
        </Section>
      )}

      {/* 4. Criados */}
      {criados.length > 0 && (
        <Section icon={Dog} iconColor="#fb923c" title={`Criados por ${kennel.name}`} count={criados.length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {criados.map((dog: any) => <PublicDogCard key={dog.id} dog={dog} />)}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ icon: Icon, iconColor, title, count, children }: { icon: any; iconColor: string; title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
        <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">{title}</h2>
        <span className="inline-flex h-6 items-center rounded-full bg-surface-card px-2 text-[11px] font-medium text-body">
          {count}
        </span>
      </div>
      {children}
    </section>
  )
}

function SaleDogCard({ dog, currencySymbol }: { dog: any; currencySymbol: Record<string, string> }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const symbol = currencySymbol[dog.sale_currency] || '€'
  return (
    <Link
      href={`/dogs/${dog.slug || dog.id}`}
      className="group relative overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
    >
      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#f59e0b] px-2 py-0.5 text-[10.5px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
        <Tag className="h-2.5 w-2.5" /> En venta
      </span>
      <div className="relative aspect-square overflow-hidden bg-surface-card">
        {dog.thumbnail_url
          ? <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="flex h-full w-full items-center justify-center"><Dog className="h-10 w-10 text-muted" /></div>
        }
        {dog.breed?.name && (
          <span className="absolute right-2 top-2 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {dog.breed.name}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </div>
      <div className="p-3">
        <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          {dog.sale_price ? (
            <p className="text-[14px] font-semibold text-ink tabular-nums">
              {Number(dog.sale_price).toLocaleString('es-ES')} {symbol}
            </p>
          ) : (
            <p className="text-[12px] text-muted">Consultar precio</p>
          )}
          {dog.sale_location && <p className="truncate text-[10.5px] text-muted">{dog.sale_location}</p>}
        </div>
      </div>
    </Link>
  )
}

function PublicDogCard({ dog }: { dog: any }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  return (
    <Link
      href={`/dogs/${dog.slug || dog.id}`}
      className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-card">
        {dog.thumbnail_url
          ? <img src={dog.thumbnail_url} alt={dog.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="flex h-full w-full items-center justify-center"><Dog className="h-10 w-10 text-muted" /></div>
        }
        {dog.breed?.name && (
          <span className="absolute right-2 top-2 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {dog.breed.name}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </div>
      <div className="p-3">
        <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        {dog.breed?.name && <p className="mt-0.5 truncate text-[11.5px] text-muted">{dog.breed.name}</p>}
      </div>
    </Link>
  )
}
