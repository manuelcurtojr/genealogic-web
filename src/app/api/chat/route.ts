import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, GENOS_TOOLS } from '@/lib/genos-prompt'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user.id

    const { message, history } = await request.json()
    if (!message?.trim()) return Response.json({ error: 'Message required' }, { status: 400 })

    // Get API key from platform_settings
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: apiKeyData } = await adminSupabase
      .from('platform_settings').select('value').eq('key', 'ANTHROPIC_API_KEY').single()
    if (!apiKeyData?.value) return Response.json({ error: 'API key not configured' }, { status: 500 })

    // Fetch user context for system prompt
    const [profileRes, dogsRes, kennelRes, littersRes, unreadRes] = await Promise.all([
      supabase.from('profiles').select('display_name, role').eq('id', userId).single(),
      supabase.from('dogs').select('id, name, sex, birth_date, breed:breeds(name), is_for_sale').eq('owner_id', userId).order('name').limit(100),
      supabase.from('kennels').select('id, name, country, city, breed_ids').eq('owner_id', userId).single(),
      supabase.from('litters').select('id').eq('owner_id', userId),
      supabase.from('conversations')
        .select('unread_owner, unread_participant, owner_id')
        .or(`owner_id.eq.${userId},participant_id.eq.${userId}`),
    ])

    const profile = profileRes.data
    const dogs = dogsRes.data || []
    const kennel = kennelRes.data
    const litterCount = littersRes.data?.length || 0
    const unreadMessages = (unreadRes.data || []).reduce((sum, c) => {
      return sum + (c.owner_id === userId ? (c.unread_owner || 0) : (c.unread_participant || 0))
    }, 0)

    const systemPrompt = buildSystemPrompt({
      displayName: profile?.display_name || user.email || 'Usuario',
      role: profile?.role || 'free',
      dogCount: dogs.length,
      kennelName: kennel?.name || null,
      kennelId: kennel?.id || null,
      litterCount,
      unreadMessages,
    })

    // Build messages from history
    const messages: Anthropic.MessageParam[] = [
      ...(history || []).slice(-20).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    // Save user message
    await supabase.from('chat_messages').insert({
      user_id: userId,
      role: 'user',
      content: message,
    })

    const anthropic = new Anthropic({ apiKey: apiKeyData.value })

    // Tool execution helper
    async function executeTool(name: string, input: any): Promise<string> {
      switch (name) {
        case 'get_my_dogs': {
          const list = dogs.map(d => {
            const breed = (d.breed as any)?.name || 'Sin raza'
            const sex = d.sex === 'male' ? 'Macho' : 'Hembra'
            const age = d.birth_date ? calcAge(d.birth_date) : 'Edad desconocida'
            return `- ${d.name} (${breed}, ${sex}, ${age})${d.is_for_sale ? ' [EN VENTA]' : ''}`
          }).join('\n')
          return list || 'No tienes perros registrados.'
        }
        case 'get_my_kennel': {
          if (!kennel) return 'No tienes un criadero registrado.'
          const { data: breeds } = await supabase.from('breeds').select('id, name')
          const breedNames = (kennel.breed_ids || [])
            .map((id: string) => breeds?.find(b => b.id === id)?.name)
            .filter(Boolean)
          return `Criadero: ${kennel.name}\nPaís: ${kennel.country || 'No especificado'}\nCiudad: ${kennel.city || 'No especificada'}\nRazas: ${breedNames.join(', ') || 'Ninguna seleccionada'}`
        }
        case 'get_my_litters': {
          const { data: litters } = await supabase
            .from('litters')
            .select('id, birth_date, status, puppy_count, father:dogs!father_id(name), mother:dogs!mother_id(name)')
            .eq('owner_id', userId)
            .order('birth_date', { ascending: false })
            .limit(20)
          if (!litters?.length) return 'No tienes camadas registradas.'
          return litters.map(l => {
            const father = (l.father as any)?.name || '?'
            const mother = (l.mother as any)?.name || '?'
            const date = l.birth_date ? new Date(l.birth_date).toLocaleDateString('es-ES') : 'Sin fecha'
            return `- ${father} x ${mother} (${date}) — ${l.status || 'planificada'}, ${l.puppy_count || 0} cachorros`
          }).join('\n')
        }
        case 'get_dog_detail': {
          const name = input.dog_name
          const { data: dog } = await supabase
            .from('dogs')
            .select('id, name, sex, birth_date, weight, height, registration, microchip, is_for_sale, sale_price, sale_currency, breed:breeds(name), color:colors(name), kennel:kennels(name), father:dogs!father_id(name), mother:dogs!mother_id(name)')
            .eq('owner_id', userId)
            .ilike('name', `%${name}%`)
            .limit(1)
            .single()
          if (!dog) return `No encontré un perro llamado "${name}" en tus registros.`
          const breed = (dog.breed as any)?.name || 'Sin raza'
          const color = (dog.color as any)?.name || 'Sin color'
          const sex = dog.sex === 'male' ? 'Macho' : 'Hembra'
          const age = dog.birth_date ? calcAge(dog.birth_date) : 'Desconocida'
          const father = (dog.father as any)?.name || 'Desconocido'
          const mother = (dog.mother as any)?.name || 'Desconocida'
          let info = `${dog.name}\n- Sexo: ${sex}\n- Raza: ${breed}\n- Color: ${color}\n- Edad: ${age}`
          if (dog.weight) info += `\n- Peso: ${dog.weight} kg`
          if (dog.height) info += `\n- Altura: ${dog.height} cm`
          if (dog.registration) info += `\n- Registro: ${dog.registration}`
          if (dog.microchip) info += `\n- Microchip: ${dog.microchip}`
          info += `\n- Padre: ${father}\n- Madre: ${mother}`
          if (dog.is_for_sale) info += `\n- EN VENTA: ${dog.sale_price ? `${dog.sale_price} ${dog.sale_currency || 'EUR'}` : 'Consultar precio'}`
          return info
        }
        case 'get_my_conversations': {
          const { data: convs } = await supabase
            .from('conversations')
            .select('id, participant_name, participant_email, last_message_at, last_message_preview, unread_owner, unread_participant, owner_id, contact:contacts(name)')
            .or(`owner_id.eq.${userId},participant_id.eq.${userId}`)
            .order('last_message_at', { ascending: false })
            .limit(15)
          if (!convs?.length) return 'No tienes conversaciones en la Bandeja.'
          return convs.map(c => {
            const contactName = (c.contact as any)?.name || c.participant_name || c.participant_email || 'Desconocido'
            const unread = c.owner_id === userId ? (c.unread_owner || 0) : (c.unread_participant || 0)
            const date = c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
            const preview = c.last_message_preview ? (c.last_message_preview.length > 50 ? c.last_message_preview.slice(0, 48) + '…' : c.last_message_preview) : '(sin mensajes)'
            return `- ${contactName}${unread > 0 ? ` [${unread} sin leer]` : ''} — ${preview} (${date})`
          }).join('\n')
        }
        case 'get_my_alerts': {
          const { data: alerts } = await supabase
            .from('notifications')
            .select('id, type, title, body, is_read, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)
          if (!alerts?.length) return 'No tienes notificaciones recientes.'
          return alerts.map(a => {
            const date = new Date(a.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            const readIcon = a.is_read ? '✓' : '●'
            return `${readIcon} ${date}: ${a.title || a.type}${a.body ? ' — ' + a.body : ''}`
          }).join('\n')
        }
        case 'get_my_plan': {
          const role = profile?.role || 'free'
          const planName = role === 'amateur' ? 'Amateur' : role === 'pro' ? 'Profesional' : role === 'admin' ? 'Admin' : 'Propietario (gratuito)'
          const maxDogs = role === 'free' ? 5 : role === 'amateur' ? 25 : '∞'
          const maxLitters = role === 'free' ? 0 : role === 'amateur' ? 3 : '∞'
          const features = []
          features.push(`Plan: ${planName}`)
          features.push(`Perros: ${dogs.length} / ${maxDogs}`)
          features.push(`Camadas: ${litterCount} / ${maxLitters}`)
          features.push(`Criadero: ${role === 'free' ? 'No incluido' : kennel ? kennel.name : 'No creado'}`)
          features.push(`CRM: ${role === 'pro' || role === 'admin' ? 'Sí' : 'No incluido'}`)
          features.push(`Planificador: ${role !== 'free' ? 'Sí' : 'No incluido'}`)
          features.push(`Analíticas: ${role === 'pro' || role === 'admin' ? 'Avanzadas' : role === 'amateur' ? 'Básicas' : 'No incluido'}`)
          features.push(`Importador IA: ${role === 'pro' || role === 'admin' ? 'Sí' : 'No incluido'}`)
          if (role === 'free') features.push(`\nPara desbloquear más funciones, visita /pricing`)
          return features.join('\n')
        }
        default:
          return 'Herramienta no disponible.'
      }
    }

    // Stream response with tool use loop
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentMessages = [...messages]
          let loopCount = 0

          while (loopCount < 5) {
            loopCount++
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1024,
              system: systemPrompt,
              tools: GENOS_TOOLS as any,
              messages: currentMessages,
              stream: true,
            })

            let hasToolUse = false
            const toolUseBlocks: any[] = []
            let currentToolId = ''
            let currentToolName = ''
            let currentToolInput = ''

            for await (const event of response) {
              if (event.type === 'content_block_start') {
                if (event.content_block.type === 'tool_use') {
                  hasToolUse = true
                  currentToolId = event.content_block.id
                  currentToolName = event.content_block.name
                  currentToolInput = ''
                }
              } else if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                  fullResponse += event.delta.text
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
                } else if (event.delta.type === 'input_json_delta') {
                  currentToolInput += event.delta.partial_json
                }
              } else if (event.type === 'content_block_stop' && hasToolUse && currentToolId) {
                let parsedInput = {}
                try { parsedInput = JSON.parse(currentToolInput || '{}') } catch {}
                toolUseBlocks.push({ id: currentToolId, name: currentToolName, input: parsedInput })
                currentToolId = ''
              }
            }

            if (!hasToolUse || toolUseBlocks.length === 0) break

            // Execute tools and continue conversation
            const assistantContent: any[] = []
            // Add any text blocks that came before tools
            if (fullResponse) {
              assistantContent.push({ type: 'text', text: fullResponse })
              fullResponse = '' // Reset for next iteration text
            }
            for (const tb of toolUseBlocks) {
              assistantContent.push({ type: 'tool_use', id: tb.id, name: tb.name, input: tb.input })
            }

            const toolResults: any[] = []
            for (const tb of toolUseBlocks) {
              const result = await executeTool(tb.name, tb.input)
              toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: result })
            }

            currentMessages = [
              ...currentMessages,
              { role: 'assistant', content: assistantContent },
              { role: 'user', content: toolResults },
            ]
          }

          // Save assistant response
          if (fullResponse.trim()) {
            await supabase.from('chat_messages').insert({
              user_id: userId,
              role: 'assistant',
              content: fullResponse,
            })
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || 'Error interno' })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: any) {
    return Response.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

function calcAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 1) return 'Recién nacido'
  if (months < 12) return `${months} mes${months > 1 ? 'es' : ''}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years} año${years > 1 ? 's' : ''} y ${rem} mes${rem > 1 ? 'es' : ''}` : `${years} año${years > 1 ? 's' : ''}`
}
