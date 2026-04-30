import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kennelId, formId, data: formData, customData } = body

    if (!kennelId || !formId || !formData?.first_name || !formData?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role — this is a public form, no authenticated user
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get kennel owner
    const { data: kennel } = await supabase.from('kennels').select('owner_id').eq('id', kennelId).single()
    if (!kennel) return NextResponse.json({ error: 'Kennel not found' }, { status: 404 })

    const ownerId = kennel.owner_id

    // 1. Create or find contact
    let contactId: string | null = null
    const { data: existingContact } = await supabase.from('contacts').select('id').ilike('email', formData.email).eq('owner_id', ownerId).limit(1)

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

    // 2. Save submission
    await supabase.from('form_submissions').insert({
      form_id: formId,
      kennel_id: kennelId,
      data: { ...formData, custom: customData || {} },
      contact_id: contactId,
    })

    // 3. Notify owner
    const contactName = `${formData.first_name} ${formData.last_name || ''}`.trim()
    const notifTitle = 'Nueva solicitud recibida'
    const notifBody = `${contactName} ha rellenado tu formulario de contacto`
    await supabase.from('notifications').insert({
      user_id: ownerId,
      type: 'contact',
      title: notifTitle,
      message: notifBody,
      link: '/notifications',
    })

    // Send push notification
    const { sendPushToUser } = await import('@/lib/push')
    await sendPushToUser(ownerId, notifTitle, notifBody, { link: '/notifications' })

    return NextResponse.json({ success: true, contactId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
