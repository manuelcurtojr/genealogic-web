import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { extractPersonalName, formatDogName, type AffixFormat } from '@/lib/affix'

async function getAdminSupabase(request?: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not admin')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const sb = await getAdminSupabase()
    const body = await request.json()

    if (body.action === 'reconcile-kennel') {
      const { kennelName, affixFormat, dogIds, existingKennelId } = body
      if (!kennelName || !dogIds?.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

      let kennelId = existingKennelId
      let ownerId: string | null = null

      if (!kennelId) {
        // Create new kennel (admin-owned initially)
        const { data: created, error } = await sb.from('kennels').insert({
          name: kennelName,
          affix_format: affixFormat || 'suffix_de',
          slug: kennelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        }).select('id').single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        kennelId = created.id
      } else {
        // Get existing kennel owner for notifications
        const { data: kennel } = await sb.from('kennels').select('owner_id').eq('id', kennelId).single()
        ownerId = kennel?.owner_id || null
      }

      // Get kennel details for renaming
      const { data: kennelData } = await sb.from('kennels').select('name, affix_format').eq('id', kennelId).single()
      const realKennelName = kennelData?.name || kennelName
      const format = (kennelData?.affix_format || affixFormat || 'suffix_de') as AffixFormat

      // Assign dogs to kennel + fix names with correct affix
      let assigned = 0
      const dogsToProcess = await sb.from('dogs').select('id, name').in('id', dogIds)
      for (const dog of (dogsToProcess.data || [])) {
        const personalName = extractPersonalName(dog.name, realKennelName)
        const correctName = formatDogName(personalName, realKennelName, format)
        const updates: Record<string, any> = { kennel_id: kennelId }
        if (correctName !== dog.name) updates.name = correctName
        const { error } = await sb.from('dogs').update(updates).eq('id', dog.id)
        if (!error) assigned++
      }

      // Notify kennel owner if exists
      if (ownerId && assigned > 0) {
        const { data: assignedDogs } = await sb.from('dogs').select('id, name').in('id', dogIds).limit(50)
        for (const dog of (assignedDogs || [])) {
          await sb.from('notifications').insert({
            user_id: ownerId,
            type: 'kennel',
            title: `Perro añadido a ${kennelName}`,
            message: `${dog.name} se ha asignado a tu criadero automaticamente por coincidencia del afijo`,
            link: `/dogs/${dog.id}`,
            is_read: false,
          })
        }
      }

      return NextResponse.json({ success: true, kennelId, assigned })
    }

    if (body.action === 'merge-dogs') {
      const { keeperId, removeId } = body
      if (!keeperId || !removeId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

      // Get both dogs
      const { data: keeper } = await sb.from('dogs').select('*').eq('id', keeperId).single()
      const { data: remove } = await sb.from('dogs').select('*').eq('id', removeId).single()
      if (!keeper || !remove) return NextResponse.json({ error: 'Dog not found' }, { status: 404 })

      const moved: Record<string, number> = {}

      // Reassign parent references
      const { count: fc } = await sb.from('dogs').update({ father_id: keeperId }, { count: 'exact' }).eq('father_id', removeId)
      const { count: mc } = await sb.from('dogs').update({ mother_id: keeperId }, { count: 'exact' }).eq('mother_id', removeId)
      moved.children = (fc || 0) + (mc || 0)

      // Move related records
      const tables = ['vet_records', 'awards', 'dog_photos', 'dog_changes', 'favorites', 'vet_reminders']
      for (const table of tables) {
        const { count } = await sb.from(table).update({ dog_id: keeperId }, { count: 'exact' }).eq('dog_id', removeId)
        if (count) moved[table] = count
      }

      // Update litters
      const { count: lf } = await sb.from('litters').update({ father_id: keeperId }, { count: 'exact' }).eq('father_id', removeId)
      const { count: lm } = await sb.from('litters').update({ mother_id: keeperId }, { count: 'exact' }).eq('mother_id', removeId)
      moved.litters = (lf || 0) + (lm || 0)

      // Fill empty fields on keeper from removed dog
      const fillFields = ['registration', 'microchip', 'breed_id', 'color_id', 'birth_date', 'weight', 'height', 'kennel_id', 'thumbnail_url', 'owner_id', 'contributor_id', 'breeder_id']
      const updates: Record<string, any> = {}
      for (const f of fillFields) {
        if (!keeper[f] && remove[f]) updates[f] = remove[f]
      }
      if (Object.keys(updates).length > 0) {
        await sb.from('dogs').update(updates).eq('id', keeperId)
      }

      // Delete removed dog
      await sb.from('dogs').delete().eq('id', removeId)

      return NextResponse.json({ success: true, deletedName: remove.name, keeperName: keeper.name, moved })
    }

    if (body.action === 'rename-kennel-dogs') {
      const { kennelId, kennelName, affixFormat } = body
      if (!kennelId || !kennelName || !affixFormat) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

      const { data: dogs } = await sb.from('dogs').select('id, name').eq('kennel_id', kennelId)
      let renamed = 0
      for (const dog of (dogs || [])) {
        const personalName = extractPersonalName(dog.name, kennelName)
        const correctName = formatDogName(personalName, kennelName, affixFormat as AffixFormat)
        if (correctName !== dog.name) {
          await sb.from('dogs').update({ name: correctName }).eq('id', dog.id)
          renamed++
        }
      }
      return NextResponse.json({ success: true, renamed, total: dogs?.length || 0 })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes('admin') ? 403 : 500 })
  }
}
