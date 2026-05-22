import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/landing-page'

/** Fetches 7 real Cocker Spaniel photos from dog.ceo for the landing mock pedigree.
 *  Failsafe: si dog.ceo está caído o tarda > 2s, devolvemos []. */
async function fetchCockerPhotos(): Promise<string[]> {
  try {
    const res = await fetch('https://dog.ceo/api/breed/spaniel-cocker/images/random/7', {
      signal: AbortSignal.timeout(2000),
      // ISR: cachear 1 día — no necesitamos fotos distintas cada request
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json?.message) ? json.message : []
  } catch {
    return []
  }
}

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
  const [{ data: featuredDogs }, cockerPhotos] = await Promise.all([
    supabase
      .from('dogs')
      .select('id, name, slug, thumbnail_url, breed:breeds(id, name)')
      .not('thumbnail_url', 'is', null)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(8),
    fetchCockerPhotos(),
  ])

  return (
    <LandingPage
      breeds={breeds || []}
      featuredDogs={featuredDogs || []}
      cockerPhotos={cockerPhotos}
    />
  )
}
