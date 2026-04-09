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

    // 4. Create deal activity with form data
    if (dealId) {
      const lines: string[] = []
      lines.push(`📋 **Formulario de contacto**`)
      lines.push(`👤 ${formData.first_name} ${formData.last_name || ''}`.trim())
      lines.push(`📧 ${formData.email}`)
      if (formData.phone) lines.push(`📱 ${formData.phone}`)
      if (formData.country || formData.city) lines.push(`📍 ${[formData.city, formData.country].filter(Boolean).join(', ')}`)
      if (formData.breed_interest_names) lines.push(`🏷️ Razas: ${formData.breed_interest_names}`)
      if (formData.dog_description) lines.push(`🐕 ${formData.dog_description}`)
      // Custom fields
      if (customData && Object.keys(customData).length > 0) {
        const { data: formDef } = await supabase.from('kennel_forms').select('fields').eq('id', formId).single()
        const fieldDefs = (formDef?.fields as any[]) || []
        for (const [fieldId, value] of Object.entries(customData)) {
          if (!value) continue
          const def = fieldDefs.find((f: any) => f.id === fieldId)
          const label = def?.label || fieldId
          lines.push(`• ${label}: ${value}`)
        }
      }
      await supabase.from('deal_activities').insert({
        deal_id: dealId,
        user_id: ownerId,
        type: 'note',
        content: lines.join('\n'),
      })
    }

    // 5. Notify owner
    const notifTitle = 'Nueva solicitud recibida'
    const notifBody = `${formData.first_name} ${formData.last_name || ''} ha rellenado tu formulario de contacto`.trim()
    await supabase.from('notifications').insert({
      user_id: ownerId,
      type: 'contact',
      title: notifTitle,
      message: notifBody,
      link: '/crm/contacts',
    })

    // Send push notification
    const { sendPushToUser } = await import('@/lib/push')
    await sendPushToUser(ownerId, notifTitle, notifBody, { link: '/crm/contacts' })

    return NextResponse.json({ success: true, contactId, dealId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
