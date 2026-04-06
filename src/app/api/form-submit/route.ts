import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kennelId, formId, data: formData, customData } = body

    if (!kennelId || !formId || !formData?.first_name || !formData?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get kennel owner
    const { data: kennel } = await supabase.from('kennels').select('owner_id').eq('id', kennelId).single()
    if (!kennel) return NextResponse.json({ error: 'Kennel not found' }, { status: 404 })

    const ownerId = kennel.owner_id

    // 1. Create or find contact
    let contactId: string | null = null
    const { data: existingContact } = await supabase.from('contacts').select('id').eq('email', formData.email).eq('owner_id', ownerId).limit(1)

    if (existingContact?.length) {
      contactId = existingContact[0].id
    } else {
      const { data: newContact } = await supabase.from('contacts').insert({
        owner_id: ownerId,
        name: `${formData.first_name} ${formData.last_name || ''}`.trim(),
        email: formData.email,
        phone: formData.phone || null,
        city: formData.city || null,
        country: formData.country || null,
      }).select('id').single()
      contactId = newContact?.id || null
    }

    // 2. Get first pipeline + first stage
    let dealId: string | null = null
    const { data: pipelines } = await supabase
      .from('pipelines')
      .select('id, stages:pipeline_stages(id, position)')
      .eq('owner_id', ownerId)
      .order('created_at')
      .limit(1)

    if (pipelines?.[0]) {
      const stages = (pipelines[0].stages as any[])?.sort((a: any, b: any) => a.position - b.position)
      const firstStageId = stages?.[0]?.id

      if (firstStageId) {
        const { data: deal } = await supabase.from('deals').insert({
          owner_id: ownerId,
          title: `Solicitud de ${formData.first_name} ${formData.last_name || ''}`.trim(),
          contact_id: contactId,
          pipeline_id: pipelines[0].id,
          stage_id: firstStageId,
        }).select('id').single()
        dealId = deal?.id || null
      }
    }

    // 3. Save submission
    await supabase.from('form_submissions').insert({
      form_id: formId,
      kennel_id: kennelId,
      data: { ...formData, custom: customData || {} },
      contact_id: contactId,
      deal_id: dealId,
    })

    // 4. Notify owner
    await supabase.from('notifications').insert({
      user_id: ownerId,
      type: 'contact',
      title: 'Nueva solicitud recibida',
      message: `${formData.first_name} ${formData.last_name || ''} ha rellenado tu formulario de contacto`.trim(),
      link: '/crm/contacts',
    })

    return NextResponse.json({ success: true, contactId, dealId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
