import { createClient } from '@/lib/supabase/server'
import FavoritesClient from '@/components/favorites/favorites-page-client'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: favorites } = await supabase
    .from('favorites')
    .select(`
      dog_id,
      dog:dogs(id, name, sex, thumbnail_url, birth_date, is_verified, breed:breeds(name), color:colors(name), kennel:kennels(name))
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const dogs = favorites?.map((f: any) => f.dog).filter(Boolean) || []

  return <FavoritesClient dogs={dogs} />
}
