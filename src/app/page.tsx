import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LandingPage from '@/components/landing/landing-page'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    redirect(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  // Fetch featured breeds with thumbnail
  const { data: breeds } = await supabase
    .from('breeds')
    .select('id, name')
    .order('name')
    .limit(20)

  // Fetch some recent public dogs for the hero showcase
  const { data: featuredDogs } = await supabase
    .from('dogs')
    .select('id, name, slug, thumbnail_url, breed:breeds(id, name)')
    .not('thumbnail_url', 'is', null)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(8)

  return <LandingPage breeds={breeds || []} featuredDogs={featuredDogs || []} />
}
