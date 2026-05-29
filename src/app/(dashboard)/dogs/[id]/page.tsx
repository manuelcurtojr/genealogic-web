import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
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
import ReportButton from '@/components/legal/report-dialog'
import ClaimBanner from '@/components/admin-requests/claim-banner'
import ModerateButton from '@/components/moderation/moderate-button'
import { HIDDEN_REASON_LABELS, type HiddenReason } from '@/lib/moderation/types'
import { EyeOff, Heart } from 'lucide-react'
import PageTracker from '@/components/track/page-tracker'
import { DogJsonLd, BreadcrumbJsonLd } from '@/lib/seo/json-ld'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: dog } = await supabase
    .from('dogs')
    .select('id, name, slug, sex, birth_date, thumbnail_url, father_id, mother_id, breed:breeds(name), color:colors(name), kennel:kennels(name)')
    .eq(field, id)
    .single()

  if (!dog) return { title: 'Perro no encontrado — Genealogic' }

  const breed = (Array.isArray(dog.breed) ? dog.breed[0]?.name : (dog.breed as any)?.name) || ''
  const color = (Array.isArray(dog.color) ? dog.color[0]?.name : (dog.color as any)?.name) || ''
  const kennel = (Array.isArray(dog.kennel) ? dog.kennel[0]?.name : (dog.kennel as any)?.name) || ''
  const sexNoun = dog.sex === 'male' ? 'macho' : dog.sex === 'female' ? 'hembra' : null

  // Padres (consulta auxiliar — añade ~10ms pero da una descripción mucho más rica)
  let fatherName: string | null = null
  let motherName: string | null = null
  if (dog.father_id || dog.mother_id) {
    const parentIds = [dog.father_id, dog.mother_id].filter(Boolean) as string[]
    const { data: parents } = await supabase
      .from('dogs')
      .select('id, name')
      .in('id', parentIds)
    for (const p of parents || []) {
      if (p.id === dog.father_id) fatherName = p.name
      if (p.id === dog.mother_id) motherName = p.name
    }
  }

  // Fecha en español: "12 de marzo de 2020"
  let dobText: string | null = null
  if (dog.birth_date) {
    const d = new Date(dog.birth_date)
    if (!isNaN(d.getTime())) {
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      dobText = `${d.getUTCDate()} de ${meses[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
    }
  }

  // Descripción natural y específica. Ejemplo:
  // "Isis Rr, hembra de Presa Canario color Bardino, nacida el 12 de marzo de 2020.
  //  Hija de Washintaul's Katho y Ventania. Criadero El Nieto. Genealogía completa en Genealogic."
  const sentences: string[] = []
  // Frase 1: identificación
  const ident: string[] = [dog.name]
  if (sexNoun || breed) {
    let frag = ''
    if (sexNoun && breed) frag = `, ${sexNoun} de raza ${breed}`
    else if (sexNoun) frag = `, ${sexNoun}`
    else if (breed) frag = `, de raza ${breed}`
    ident.push(frag)
  }
  if (color) ident.push(`, color ${color.toLowerCase()}`)
  if (dobText) ident.push(`, nacid${dog.sex === 'female' ? 'a' : 'o'} el ${dobText}`)
  sentences.push(ident.join('') + '.')

  // Frase 2: padres
  if (fatherName && motherName) {
    sentences.push(`Hij${dog.sex === 'female' ? 'a' : 'o'} de ${fatherName} y ${motherName}.`)
  } else if (fatherName) {
    sentences.push(`Padre: ${fatherName}.`)
  } else if (motherName) {
    sentences.push(`Madre: ${motherName}.`)
  }

  // Frase 3: criadero
  if (kennel) sentences.push(`Criadero ${kennel}.`)

  // Frase 4: CTA
  sentences.push('Genealogía completa y árbol genealógico en Genealogic.')

  let description = sentences.join(' ')
  // Google trunca alrededor de 160 chars; intentamos que la primera frase quede entera y completa <= 320
  if (description.length > 320) description = description.slice(0, 317) + '…'

  const url = `https://genealogic.io/dogs/${dog.slug || id}`
  const image = dog.thumbnail_url || 'https://genealogic.io/icon.svg'

  // Title más rico: incluye raza para keyword matching ("Isis Rr — Presa Canario · Genealogic")
  // El layout añade " · Genealogic" via template, así que NO incluimos sufijo "| Genealogic"
  // para no duplicar.
  const titleParts: string[] = [dog.name]
  if (breed) titleParts.push(breed)
  const title = titleParts.join(' — ')

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: dog.name,
      description,
      url,
      siteName: 'Genealogic',
      images: [{ url: image, width: 800, height: 800, alt: dog.name }],
      type: 'profile',
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
    .select(`*, breed:breeds(id, name, slug), color:colors(id, name), kennel:kennels(id, name, logo_url)`)
    .eq(field, id)
    .single()

  if (!dog) notFound()

  // 301 canónica: si llegan por UUID y el perro tiene slug, redirigimos a
  // la URL legible. Mejora SEO (un solo canonical) y evita contenido
  // duplicado en buscadores.
  if (field === 'id' && dog.slug && dog.slug !== id) {
    redirect(`/dogs/${dog.slug}`)
  }

  // ── Soft-hide gating ─────────────────────────────────────────────────
  // Si el perro está oculto:
  //  · Admin → ve la página completa con banner rojo + botón restaurar
  //  · Owner → ve la página (para que pueda apelar)
  //  · Resto / anónimo → 404 (no indexable)
  // Comprobación de admin: lookup directo del role del usuario.
  let userIsAdmin = false
  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userIsAdmin = prof?.role === 'admin'
  }
  const isOwnerOfDog = !!(user && dog.owner_id && user.id === dog.owner_id)
  const isHidden = !!dog.hidden_at
  if (isHidden && !userIsAdmin && !isOwnerOfDog) {
    notFound()
  }

  const [fatherRes, motherRes] = await Promise.all([
    dog.father_id ? supabase.from('dogs').select('id, name, sex, thumbnail_url, slug').eq('id', dog.father_id).single() : { data: null },
    dog.mother_id ? supabase.from('dogs').select('id, name, sex, thumbnail_url, slug').eq('id', dog.mother_id).single() : { data: null },
  ])
  const father = fatherRes.data
  const mother = motherRes.data

  const isOwner = user?.id === dog.owner_id
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const breedName = (dog.breed as any)?.name
  const breedSlug = (dog.breed as any)?.slug as string | null | undefined
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

  const canonicalUrl = `https://genealogic.io/dogs/${dog.slug || dog.id}`
  const dogDescription = `${dog.name}${breedName ? `, ${breedName}` : ''}${
    kennel?.name ? ` de ${kennel.name}` : ''
  }. Genealogic — Plataforma de Crianza Canina.`

  return (
    <div>
      <DogJsonLd
        name={dog.name}
        url={canonicalUrl}
        description={dogDescription}
        image={dog.thumbnail_url || undefined}
        breed={breedName}
        color={colorName}
        sex={dog.sex}
        birthDate={dog.birth_date}
        kennel={kennel ? { name: kennel.name, slug: kennel.slug, url: kennel.slug ? `https://genealogic.io/kennels/${kennel.slug}` : undefined } : null}
        sireName={father?.name}
        damName={mother?.name}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: 'https://genealogic.io' },
          ...(kennel ? [{ name: kennel.name, url: `https://genealogic.io/kennels/${kennel.slug || kennel.id}` }] : []),
          { name: dog.name, url: canonicalUrl },
        ]}
      />
      <PageTracker kennelId={kennel?.id || null} dogId={dog.id} />
      {/* Gallery — full bleed: public = 100vw, logged-in = cancel padding */}
      <div className={`relative overflow-hidden ${user ? '-mx-4 -mt-4 sm:-mx-[30px] sm:-mt-[30px]' : ''}`}
        style={!user ? { marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', marginTop: '-24px', width: '100vw' } : undefined}>
        <DogGallery
          photos={galleryPhotos}
          name={dog.name}
          sex={dog.sex}
          upscaledPhotoUrl={dog.thumbnail_url}
          upscaledOriginalUrl={dog.original_thumbnail_url}
          upscaledAt={dog.thumbnail_upscaled_at}
          dogId={dog.id}
          dogUrl={`/dogs/${dog.slug || dog.id}`}
          currentUserEmail={user?.email || null}
        />

        {/* Action buttons top-right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {isOwner && user && <DogEditButton dogId={dog.id} userId={user.id} />}
          <ShareButton dog={{ name: dog.name, sex: dog.sex, breed_name: breedName, kennel_name: kennel?.name, thumbnail_url: dog.thumbnail_url, birth_date: dog.birth_date }} dogUrl={`/dogs/${dog.slug || dog.id}`} />
          {!isOwner && (
            <ReportButton
              targetType="dog"
              targetId={dog.id}
              targetUrl={`/dogs/${dog.slug || dog.id}`}
              targetLabel={dog.name}
              currentUserEmail={user?.email || null}
            />
          )}
        </div>

        {/* Back button top-left */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <BackButton fallback="/dogs" />
        </div>
      </div>

      {/* Content */}
      <div className="lg:px-[30px] pt-6 sm:pt-8 pb-8 sm:pb-10 space-y-6 sm:space-y-8">
        {/* Banner de moderación — solo admin si el perro está oculto */}
        {isHidden && userIsAdmin && dog.hidden_reason && (
          <ModerateButton
            targetType="dog"
            targetId={dog.id}
            targetLabel={dog.name}
            hidden={{
              reason: dog.hidden_reason as HiddenReason,
              notes: dog.hidden_notes || null,
              at: dog.hidden_at,
            }}
            reportId={dog.hidden_report_id || null}
            variant="banner"
          />
        )}

        {/* Aviso al owner cuando su perro está oculto (para que pueda apelar) */}
        {isHidden && !userIsAdmin && isOwnerOfDog && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 flex items-start gap-3">
            <EyeOff className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-900">
                Este perro está oculto al público
              </p>
              <p className="text-[12px] text-red-800 mt-1">
                Motivo: <strong>{dog.hidden_reason && HIDDEN_REASON_LABELS[dog.hidden_reason as HiddenReason]}</strong>.
                Si crees que es un error o quieres aportar pruebas, escríbenos a{' '}
                <a href="mailto:hola@genealogic.io?subject=Apelaci%C3%B3n%20perro%20oculto" className="font-medium underline">
                  hola@genealogic.io
                </a>.
              </p>
            </div>
          </div>
        )}

        {/* Claim banner — solo si el perro no tiene owner asignado */}
        {!dog.owner_id && !isHidden && (
          <ClaimBanner type="dog" targetId={dog.slug || dog.id} targetName={dog.name} />
        )}

        {/* In Memoriam — franja conmemorativa si el perro ha fallecido */}
        {dog.deceased_at && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-2.5">
            <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <p className="text-[13px] text-rose-900">
              <strong>En memoria</strong>
              {' · '}
              {new Date(dog.deceased_at).toLocaleDateString('es-ES', { year: 'numeric' })}
              {dog.birth_date && ` · ${new Date(dog.birth_date).getFullYear()}–${new Date(dog.deceased_at).getFullYear()}`}
            </p>
          </div>
        )}

        {/* Name + badges */}
        <div>
          <h1 className="text-[28px] sm:text-[44px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink break-words hyphens-auto">
            {dog.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {breedName && (
              breedSlug ? (
                <Link
                  href={`/razas/${breedSlug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
                  title={`Ver estándar de la raza ${breedName}`}
                >
                  {breedName}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1 text-[13px] font-medium text-body">
                  {breedName}
                </span>
              )
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

      {/* Genealogía — full bleed: rompe el max-w-7xl del dashboard layout
          en pantallas anchas para mostrar más generaciones sin scroll
          horizontal. `calc(50% - 50vw)` se vuelve 0 cuando no hay espacio
          extra (≤1280px), así que en lg no rompe nada. En 2xl (1536px+)
          aprovecha los ~256px sobrantes para ensanchar el árbol. */}
      {pedigree && pedigree.length > 1 && (
        <div className="mt-4 sm:mt-8 -mx-4 sm:-mx-[30px] lg:mx-[calc(50%-50vw)] lg:px-6">
          <h2 className="mb-5 px-4 sm:px-[30px] lg:px-2 text-[22px] font-semibold tracking-[-0.04em] text-ink sm:mb-6">
            Genealogía
          </h2>
          <PedigreeTree data={pedigree} rootId={dog.id} breedId={dog.breed_id} />
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
          : <div className="flex h-full w-full items-center justify-center"><img src="/icon.svg?v=2" alt="" className="h-5 w-5 opacity-20" /></div>}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{role}</p>
        <p className="text-[15px] font-medium text-ink truncate">{parent.name}</p>
      </div>
    </Link>
  )
}
