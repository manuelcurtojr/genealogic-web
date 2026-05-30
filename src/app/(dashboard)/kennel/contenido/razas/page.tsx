/**
 * /kennel/contenido/razas — el criador elige qué perro suyo es la cara
 * de cada raza en su web Pro.
 *
 * Requiere Kennel Pro (el layout ya hace el gate).
 *
 * La página detecta automáticamente las razas que el kennel cría
 * (perros con is_reproductive=true). Para cada raza muestra:
 *   · Foto actualmente elegida (manual o fallback automático)
 *   · Grid de candidatos: todos los perros del kennel de esa raza con foto
 *   · Botón "Automático" para volver al fallback
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BreedHeroPicker, { type BreedHeroPickerBreed } from '@/components/kennel/breed-hero-picker'
import {
  getKennelReproductiveBreeds,
  getKennelBreedHeroMap,
  pickKennelHeroPhotoForBreed,
  listKennelDogsByBreedWithPhoto,
} from '@/lib/kennel/breeds'

export const dynamic = 'force-dynamic'

export default async function KennelRazasPickerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!kennel) redirect('/kennel/new')

  // Razas que cría (con reproductores + promotional_content). Si no hay
  // ninguna, el componente muestra un empty state explicando qué hacer.
  const breeds = await getKennelReproductiveBreeds(kennel.id)
  const heroMap = await getKennelBreedHeroMap(kennel.id)

  // Para cada raza: lista de candidatos (perros con foto) + foto actual
  const data: BreedHeroPickerBreed[] = await Promise.all(
    breeds.map(async (b) => {
      const [dogs, current] = await Promise.all([
        listKennelDogsByBreedWithPhoto(kennel.id, b.id),
        pickKennelHeroPhotoForBreed(kennel.id, b.id),
      ])
      return {
        id: b.id,
        slug: b.slug,
        name: b.name,
        picked_dog_id: heroMap[b.id] || null,
        current_hero_url: current?.url || b.image_url,
        current_hero_dog_name: current?.dogName || null,
        dogs,
      }
    }),
  )

  return (
    <div>
      <header className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Web Pro</p>
        <h2 className="mt-1 text-[22px] sm:text-[24px] font-semibold tracking-[-0.025em] text-ink">
          Nuestras razas
        </h2>
        <p className="mt-2 text-[13.5px] text-body max-w-prose">
          Elige qué perro tuyo representa cada raza en tu web pública. Si no
          eliges nada, el sistema escoge automáticamente un reproductor con
          foto.
        </p>
      </header>

      <BreedHeroPicker breeds={data} />
    </div>
  )
}
