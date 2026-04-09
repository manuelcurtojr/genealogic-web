import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { getPlanLimits, roleAtLeast } from '@/lib/permissions'

/**
 * Generate marketing notifications for the current user based on their usage patterns.
 * Called on dashboard load to check for opportunities.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || 'free'

    // Don't send marketing to pro/admin
    if (roleAtLeast(role, 'pro')) return Response.json({ sent: 0 })

    const limits = getPlanLimits(role)
    const notifications: { type: string; title: string; message: string; link: string }[] = []

    // Check: last marketing notification sent (don't spam — max 1 per week)
    const { data: lastNotif } = await admin
      .from('notifications')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('type', 'marketing')
      .order('created_at', { ascending: false })
      .limit(1)

    if (lastNotif?.length) {
      const daysSince = (Date.now() - new Date(lastNotif[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) return Response.json({ sent: 0, reason: 'too_recent' })
    }

    // --- Free user opportunities ---
    if (role === 'free') {
      // Near dog limit
      const { count: dogCount } = await admin.from('dogs').select('id', { count: 'exact', head: true }).eq('owner_id', user.id)
      if (limits.maxDogs && dogCount && dogCount >= limits.maxDogs - 1) {
        notifications.push({
          type: 'marketing',
          title: '¡Casi al límite!',
          message: `Tienes ${dogCount}/${limits.maxDogs} perros. Mejora a Amateur para tener hasta 25 perros y gestionar camadas.`,
          link: '/pricing',
        })
      }

      // Has dogs with complete pedigree → suggest breeding
      const { count: pedigreeCount } = await admin.from('dogs')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .not('father_id', 'is', null)
        .not('mother_id', 'is', null)
      if (pedigreeCount && pedigreeCount >= 2) {
        notifications.push({
          type: 'marketing',
          title: 'Pedigrees completos',
          message: `Tienes ${pedigreeCount} perros con pedigree completo. Con Amateur podrías planificar cruces y gestionar camadas.`,
          link: '/pricing',
        })
      }
    }

    // --- Amateur user opportunities ---
    if (role === 'amateur') {
      // Has form submissions but no CRM
      const { data: kennel } = await admin.from('kennels').select('id').eq('owner_id', user.id).single()
      if (kennel) {
        const { count: subCount } = await admin.from('form_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('kennel_id', kennel.id)
        if (subCount && subCount >= 5) {
          notifications.push({
            type: 'marketing',
            title: `${subCount} solicitudes recibidas`,
            message: `Has recibido ${subCount} solicitudes. Con el plan Profesional tendrás un CRM completo con pipelines para gestionar tus clientes.`,
            link: '/pricing',
          })
        }
      }
    }

    // Insert max 1 notification
    if (notifications.length > 0) {
      const notif = notifications[0]
      await admin.from('notifications').insert({
        user_id: user.id,
        ...notif,
      })
      return Response.json({ sent: 1 })
    }

    return Response.json({ sent: 0 })
  } catch (err: any) {
    console.error('Marketing notification error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
