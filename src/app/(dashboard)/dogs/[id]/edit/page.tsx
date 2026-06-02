import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import DogForm from '@/components/dogs/dog-form'
import FeedbackButton from '@/components/feedback/feedback-button'

export default async function EditDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: dog } = await supabase
    .from('dogs')
    .select('*')
    .eq('id', id)
    .single()

  if (!dog) notFound()
  if (dog.owner_id !== user.id) redirect('/dogs')

  const [breedsRes, colorsRes, kennelsRes, maleDogsRes, femaleDogsRes] = await Promise.all([
    supabase.from('breeds').select('id, name').order('name'),
    supabase.from('colors').select('id, name').order('name'),
    supabase.from('kennels').select('id, name').eq('owner_id', user.id).order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'male').order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'female').order('name'),
  ])

  // Opciones de padre/madre = perros del usuario + los padres ACTUALES del perro
  // aunque sean ancestros importados (owner_id=null) o de otro criadero. Sin esto,
  // father_id/mother_id apuntan a un perro que no está en las opciones y el selector
  // sale vacío. Los actuales se resuelven con el cliente admin (la RLS del usuario
  // no ve perros privados ajenos).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parentIds = [dog.father_id, dog.mother_id].filter(Boolean) as string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const parentDogsRes = parentIds.length
    ? await admin.from('dogs').select('id, name, sex').in('id', parentIds)
    : { data: [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parentDogs = (parentDogsRes.data || []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mergeById = (a: any[], b: any[]) => {
    const seen = new Set(a.map((x) => x.id))
    return [...a, ...b.filter((x) => !seen.has(x.id))]
  }
  const maleDogs = mergeById(maleDogsRes.data || [], parentDogs.filter((d) => d.sex === 'male').map((d) => ({ id: d.id, name: d.name })))
  const femaleDogs = mergeById(femaleDogsRes.data || [], parentDogs.filter((d) => d.sex === 'female').map((d) => ({ id: d.id, name: d.name })))

  return (
    <>
      <DogForm
        initialData={dog}
        breeds={breedsRes.data || []}
        colors={colorsRes.data || []}
        kennels={kennelsRes.data || []}
        maleDogs={maleDogs}
        femaleDogs={femaleDogs}
        userId={user.id}
      />
      {/* La pestaña "Importador" vive aquí también, así que mandamos scope=dog_form
          y el user puede aclarar en el mensaje si era el importer. Si en el futuro
          el importador se separa a otra ruta, cambiar el scope a "importer". */}
      <FeedbackButton scope="dog_form" pageLabel={`Editar perro: ${dog.name} (incluye importador)`} />
    </>
  )
}
