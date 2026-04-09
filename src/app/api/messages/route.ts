import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversationId, content } = await request.json()
    if (!conversationId || !content?.trim()) return Response.json({ error: 'Missing data' }, { status: 400 })

    // Verify user is part of conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, owner_id, participant_id')
      .eq('id', conversationId)
      .single()

    if (!conv) return Response.json({ error: 'Conversation not found' }, { status: 404 })

    const isOwner = conv.owner_id === user.id
    const isParticipant = conv.participant_id === user.id
    if (!isOwner && !isParticipant) return Response.json({ error: 'Not authorized' }, { status: 403 })

    // Insert message
    const { data: msg, error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      type: 'text',
    }).select('id, content, sender_id, type, created_at').single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Update conversation metadata
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const updateData: any = {
      last_message_at: new Date().toISOString(),
      last_message_preview: content.trim().substring(0, 100),
    }

    // Increment unread for the other party
    // Fetch current counts to increment
    const { data: currentConv } = await admin.from('conversations').select('unread_owner, unread_participant').eq('id', conversationId).single()
    if (isOwner) {
      updateData.unread_participant = ((currentConv as any)?.unread_participant || 0) + 1
    } else {
      updateData.unread_owner = ((currentConv as any)?.unread_owner || 0) + 1
    }

    await admin.from('conversations').update(updateData).eq('id', conversationId)

    // Send push notification to the other party
    const recipientId = isOwner ? conv.participant_id : conv.owner_id
    if (recipientId) {
      const { data: profile } = await admin.from('profiles').select('display_name').eq('id', user.id).single()
      const senderName = profile?.display_name || 'Alguien'
      const { sendPushToUser } = await import('@/lib/push')
      await sendPushToUser(recipientId, `Mensaje de ${senderName}`, content.trim().substring(0, 100), { link: '/inbox' })
    }

    return Response.json(msg)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
