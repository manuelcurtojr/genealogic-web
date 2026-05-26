import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewsEditor from '@/components/kennel/reviews-editor'

export const dynamic = 'force-dynamic'

export default async function KennelReviewsEditorPage() {
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

  const { data: reviews } = await supabase
    .from('kennel_reviews')
    .select('id, author_name, body, rating, is_visible, author_avatar_url')
    .eq('kennel_id', kennel.id)
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  return <ReviewsEditor kennelId={kennel.id} initialReviews={reviews || []} />
}
