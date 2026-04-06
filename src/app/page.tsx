import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LandingPage from '@/components/landing/landing-page'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  // Fetch featured breeds with thumbnail
  const { data: breeds } = await supabase
    .from('breeds')
    .select('id, name')
    .order('name')
    .limit(20)

  // Fetch some recent public dogs for the breed thumbnails
  const { data: featuredDogs } = await supabase
    .from('dogs')
    .select('id, name, thumbnail_url, breed:breeds(id, name)')
    .eq('is_public', true)
    .not('thumbnail_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(8)

  return <LandingPage breeds={breeds || []} featuredDogs={featuredDogs || []} />
}
