import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const userId = user.id

    // 1. Find dogs that CAN be fully deleted (no descendants, not parent of any dog, no litters)
    const { data: allDogs } = await supabase.from('dogs').select('id').eq('owner_id', userId)
    const dogIds = (allDogs || []).map(d => d.id)

    const deletableDogIds: string[] = []
    const keepDogIds: string[] = []

    for (const dogId of dogIds) {
      // Check if this dog is father or mother of ANY dog (including other users')
      const { count: asParent } = await supabase.from('dogs')
        .select('id', { count: 'exact', head: true })
        .or(`father_id.eq.${dogId},mother_id.eq.${dogId}`)

      // Check if this dog is in any litter as father or mother
      const { count: inLitter } = await supabase.from('litters')
        .select('id', { count: 'exact', head: true })
        .or(`father_id.eq.${dogId},mother_id.eq.${dogId}`)

      if ((asParent || 0) === 0 && (inLitter || 0) === 0) {
        deletableDogIds.push(dogId)
      } else {
        keepDogIds.push(dogId)
      }
    }

    // 2. Find litters that CAN be deleted (no puppies)
    const { data: allLitters } = await supabase.from('litters').select('id, puppy_count').eq('owner_id', userId)
    const deletableLitterIds = (allLitters || []).filter(l => !l.puppy_count || l.puppy_count === 0).map(l => l.id)
    const keepLitterIds = (allLitters || []).filter(l => l.puppy_count && l.puppy_count > 0).map(l => l.id)

    // 3. Check kennel — keep if has dogs or litters
    const { data: kennels } = await supabase.from('kennels').select('id').eq('owner_id', userId)
    const kennelIds = (kennels || []).map(k => k.id)

    const deletableKennelIds: string[] = []
    const keepKennelIds: string[] = []

    for (const kennelId of kennelIds) {
      const { count: kennelDogs } = await supabase.from('dogs')
        .select('id', { count: 'exact', head: true })
        .eq('kennel_id', kennelId)
      const { count: kennelLitters } = await supabase.from('litters')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)

      if ((kennelDogs || 0) === 0 && (kennelLitters || 0) === 0) {
        deletableKennelIds.push(kennelId)
      } else {
        keepKennelIds.push(kennelId)
      }
    }

    // === EXECUTE DELETIONS ===

    // Delete private data (always safe to delete)
    await supabase.from('notifications').delete().eq('user_id', userId)

    // Delete device tokens
    await supabase.from('device_tokens').delete().eq('user_id', userId)

    // Delete subscriptions
    await supabase.from('subscriptions').delete().eq('user_id', userId)

    // Delete contacts
    await supabase.from('contacts').delete().eq('owner_id', userId)
    if (kennelIds.length > 0) {
      await supabase.from('form_submissions').delete().in('kennel_id', kennelIds)
      await supabase.from('kennel_forms').delete().eq('owner_id', userId)
    }
    const { data: pipelineData } = await supabase.from('pipelines').select('id').eq('owner_id', userId)
    const pipelineIds = (pipelineData || []).map(p => p.id)
    if (pipelineIds.length > 0) {
      await supabase.from('pipeline_stages').delete().in('pipeline_id', pipelineIds)
    }
    await supabase.from('pipelines').delete().eq('owner_id', userId)

    // Delete vet records and awards for deletable dogs
    if (deletableDogIds.length > 0) {
      await supabase.from('vet_records').delete().in('dog_id', deletableDogIds)
      await supabase.from('awards').delete().in('dog_id', deletableDogIds)
      await supabase.from('dog_photos').delete().in('dog_id', deletableDogIds)
      await supabase.from('dogs').delete().in('id', deletableDogIds)
    }

    // Delete empty litters
    if (deletableLitterIds.length > 0) {
      await supabase.from('litters').delete().in('id', deletableLitterIds)
    }

    // Delete empty kennels
    if (deletableKennelIds.length > 0) {
      await supabase.from('kennels').delete().in('id', deletableKennelIds)
    }

    // === ANONYMIZE what we keep ===

    // Anonymize dogs that must be kept (have descendants/pedigree connections)
    if (keepDogIds.length > 0) {
      await supabase.from('dogs').update({
        owner_id: userId, // keep for now — will be orphaned when profile is anonymized
        is_public: true,
        is_for_sale: false,
        sale_price: null,
        sale_description: null,
        sale_location: null,
        sale_zipcode: null,
      }).in('id', keepDogIds)

      // Keep vet records but mark as public, remove private notes
      await supabase.from('vet_records').update({ is_public: true }).in('dog_id', keepDogIds)
      await supabase.from('awards').update({ is_public: true }).in('dog_id', keepDogIds)
    }

    // Anonymize kept kennels — remove contact info but keep as historical profile
    if (keepKennelIds.length > 0) {
      await supabase.from('kennels').update({
        description: null,
        website: null,
        social_instagram: null,
        social_facebook: null,
        social_tiktok: null,
        social_youtube: null,
        whatsapp_phone: null,
        whatsapp_text: null,
        whatsapp_enabled: false,
      }).in('id', keepKennelIds)
    }

    // Anonymize kept litters
    if (keepLitterIds.length > 0) {
      await supabase.from('litters').update({ is_public: true }).in('id', keepLitterIds)
    }

    // Anonymize profile — keep minimal record, remove personal data
    await supabase.from('profiles').update({
      display_name: 'Usuario eliminado',
      avatar_url: null,
      phone: null,
      country: null,
      city: null,
      bio: null,
    }).eq('id', userId)

    // Sign out
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      summary: {
        dogs_deleted: deletableDogIds.length,
        dogs_kept: keepDogIds.length,
        litters_deleted: deletableLitterIds.length,
        litters_kept: keepLitterIds.length,
        kennels_deleted: deletableKennelIds.length,
        kennels_kept_anonymized: keepKennelIds.length,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
