import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Mars, Venus, Calendar, Hash, Weight, Ruler, Microchip, Palette } from 'lucide-react'
import BackButton from '@/components/ui/back-button'
import { BRAND } from '@/lib/constants'
import { isUUID } from '@/lib/slug'
import PedigreeTree from '@/components/pedigree/pedigree-tree'
import DogGallery from '@/components/dogs/dog-gallery'
import DogTabs from '@/components/dogs/dog-tabs'
import DogEditButton from '@/components/dogs/dog-edit-button'
import ShareButton from '@/components/dogs/share-button'
import PageTracker from '@/components/track/page-tracker'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: dog } = await supabase
    .from('dogs')
    .select('name, slug, sex, birth_date, thumbnail_url, breed:breeds(name), color:colors(name), kennel:kennels(name)')
    .eq(field, id)
    .single()

  if (!dog) return { title: 'Perro no encontrado — Genealogic' }

  const breed = (Array.isArray(dog.breed) ? dog.breed[0]?.name : (dog.breed as any)?.name) || ''
  const color = (Array.isArray(dog.color) ? dog.color[0]?.name : (dog.color as any)?.name) || ''
  const kennel = (Array.isArray(dog.kennel) ? dog.kennel[0]?.name : (dog.kennel as any)?.name) || ''
  const sex = dog.sex === 'male' ? 'Macho' : dog.sex === 'female' ? 'Hembra' : ''

  const parts = [breed, sex, color].filter(Boolean)
  const description = `${dog.name}${parts.length ? ' — ' + parts.join(' · ') : ''}${kennel ? ' | Criadero ' + kennel : ''} | Genealogic`

  const url = `https://genealogic.io/dogs/${dog.slug || id}`
  const image = dog.thumbnail_url || 'https://genealogic.io/icon.svg'

  return {
    title: `${dog.name} — Genealogic`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: dog.name,
      description,
      url,
      siteName: 'Genealogic',
      images: [{ url: image, width: 800, height: 800, alt: dog.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dog.name,
      description,
      images: [image],
    },
  }
}

export default async function DogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Accept both UUID and slug
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: dog } = await supabase
    .from('dogs')
    .select(`*, breed:breeds(id, name), color:colors(id, name), kennel:kennels(id, name, logo_url)`)
    .eq(field, id)
    .single()

  if (!dog) notFound()

  const [fatherRes, motherRes] = await Promise.all([
    dog.father_id ? supabase.from('dogs').select('id, name, sex, thumbnail_url, slug').eq('id', dog.father_id).single() : { data: null },
    dog.mother_id ? supabase.from('dogs').select('id, name, sex, thumbnail_url, slug').eq('id', dog.mother_id).single() : { data: null },
  ])
  const father = fatherRes.data
  const mother = motherRes.data

  const isOwner = user?.id === dog.owner_id
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const breedName = (dog.breed as any)?.name
  const colorName = (dog.color as any)?.name
  const kennel = dog.kennel as any

  // Fetch gallery photos + pedigree (may fail for unauthenticated users due to RLS)
  let galleryPhotos: string[] = []
  let pedigree: any[] | null = null
  try {
    const [photosRes, pedigreeRes] = await Promise.all([
      supabase.from('dog_photos').select('id, url, position').eq('dog_id', dog.id).order('position'),
      supabase.rpc('get_pedigree', { dog_uuid: dog.id, max_gen: 5 }),
    ])
    galleryPhotos = (photosRes.data || []).map((p: any) => p.url)
    pedigree = pedigreeRes.data
  } catch {}
  // Include thumbnail_url as first photo if not already in gallery
  if (dog.thumbnail_url && !galleryPhotos.includes(dog.thumbnail_url)) {
    galleryPhotos.unshift(dog.thumbnail_url)
  }

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: dog.name,
    description: `${dog.name}${breedName ? `, ${breedName}` : ''}${kennel?.name ? ` de ${kennel.name}` : ''}. Genealogic — Plataforma de Crianza Canina.`,
    image: dog.thumbnail_url || 'https://genealogic.io/icon.svg',
    url: `https://genealogic.io/dogs/${dog.slug || dog.id}`,
    ...(breedName && { additionalType: breedName }),
    ...(dog.birth_date && { birthDate: dog.birth_date }),
    ...(dog.sex && { gender: dog.sex === 'male' ? 'Male' : 'Female' }),
    ...(kennel && { isPartOf: { '@type': 'Organization', name: kennel.name } }),
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageTracker kennelId={kennel?.id || null} dogId={dog.id} />
      {/* Gallery — full bleed: public = 100vw, logged-in = cancel padding */}
      <div className={`relative overflow-hidden ${user ? '-mx-4 -mt-4 sm:-mx-[30px] sm:-mt-[30px]' : ''}`}
        style={!user ? { marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', marginTop: '-24px', width: '100vw' } : undefined}>
        <DogGallery photos={galleryPhotos} name={dog.name} sex={dog.sex} />

        {/* Action buttons top-right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isOwner && user && <DogEditButton dogId={dog.id} userId={user.id} />}
          <ShareButton dog={{ name: dog.name, sex: dog.sex, breed_name: breedName, kennel_name: kennel?.name, thumbnail_url: dog.thumbnail_url, birth_date: dog.birth_date }} dogUrl={`/dogs/${dog.slug || dog.id}`} />
        </div>

        {/* Back button top-left */}
        <div className="absolute top-4 left-4">
          <BackButton fallback="/dogs" />
        </div>
      </div>

      {/* Content */}
      <div className="lg:px-[30px] pt-6 sm:pt-8 pb-8 sm:pb-10 space-y-6 sm:space-y-8">
        {/* Name + badges */}
        <div>
          <h1 className="text-[32px] sm:text-[44px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink">
            {dog.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {breedName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1 text-[13px] font-medium text-body">
                {breedName}
              </span>
            )}
            {kennel?.name && (
              <Link
                href={`/kennels/${kennel.slug || kennel.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas px-3 py-1 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
              >
                {kennel.logo_url && <img src={kennel.logo_url} alt="" className="h-4 w-4 rounded-full object-cover" />}
                {kennel.name}
              </Link>
            )}
          </div>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap items-center gap-2">
          <Chip icon={dog.sex === 'male' ? Mars : Venus} label="Sexo" value={dog.sex === 'male' ? 'Macho' : 'Hembra'} color={sexColor} />
          {colorName && <Chip icon={Palette} label="Color" value={colorName} />}
          {dog.birth_date && <Chip icon={Calendar} label="Nacimiento" value={new Date(dog.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} />}
          {dog.weight && <Chip icon={Weight} label="Peso" value={`${dog.weight} kg`} />}
          {dog.height && <Chip icon={Ruler} label="Altura" value={`${dog.height} cm`} />}
        </div>

        {/* Parents */}
        {(father || mother) && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ParentCard parent={father} role="Padre" />
            <ParentCard parent={mother} role="Madre" />
          </div>
        )}

        {/* Tabs */}
        <DogTabs dogId={dog.id} ownerId={dog.owner_id} isOwner={isOwner} fatherId={dog.father_id} motherId={dog.mother_id} dogSex={dog.sex} />
      </div>

      {/* Pedigree — full bleed on mobile, padding inside scroll */}
      {pedigree && pedigree.length > 1 && (
        <div className="-mx-4 lg:mx-0 mt-4 sm:mt-8">
          <h2 className="mb-5 px-4 text-[22px] font-semibold tracking-[-0.04em] text-ink lg:px-0 sm:mb-6">
            Pedigrí
          </h2>
          <PedigreeTree data={pedigree} rootId={dog.id} />
        </div>
      )}
    </div>
  )
}

function Chip({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted" style={color ? { color } : undefined} />
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{label}</span>
      <span className="text-[13px] font-medium text-ink">{value}</span>
    </div>
  )
}

function ParentCard({ parent, role }: { parent: any; role: string }) {
  const isFather = role === 'Padre'
  const sexColor = isFather ? BRAND.male : BRAND.female

  if (!parent) return (
    <div className="rounded-xl border border-dashed border-hairline bg-surface-soft p-4 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{role}</p>
      <p className="mt-1 text-[14px] text-body">Desconocido</p>
    </div>
  )

  return (
    <Link
      href={`/dogs/${parent.slug || parent.id}`}
      className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-3 transition-colors hover:bg-surface-soft sm:p-4"
    >
      <div
        className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 bg-surface-card"
        style={{ borderColor: sexColor }}
      >
        {parent.thumbnail_url
          ? <img src={parent.thumbnail_url} alt="" className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center"><img src="/icon.svg" alt="" className="h-5 w-5 opacity-20" /></div>}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{role}</p>
        <p className="text-[15px] font-medium text-ink truncate">{parent.name}</p>
      </div>
    </Link>
  )
}
