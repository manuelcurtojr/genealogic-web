import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeaturedDogsPicker from '@/components/kennel/featured-dogs-picker'

export const dynamic = 'force-dynamic'

export default async function KennelFeaturedDogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!kennel) redirect('/kennel/new')

  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, thumbnail_url, featured_in_home, breed:breeds(name)')
    .eq('kennel_id', kennel.id)
    .or('show_in_kennel.is.null,show_in_kennel.eq.true')
    .order('featured_in_home', { ascending: false })
    .order('name')

  // Normaliza breed (array → objeto)
  const list = (dogs || []).map(d => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const br = (d as any).breed
    const breed = Array.isArray(br) ? br[0] : br
    return {
      id: d.id,
      name: d.name,
      thumbnail_url: d.thumbnail_url,
      featured_in_home: d.featured_in_home,
      breed_name: breed?.name || null,
    }
  })

  return <FeaturedDogsPicker dogs={list} />
}
