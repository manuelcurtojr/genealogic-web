/**
 * Contactos — vista unificada de todos los "personas que rodean al criadero".
 *
 * 3 tabs:
 *  - Suscriptores: newsletter_subscribers (gente suscrita al newsletter)
 *  - Leads:        puppy_reservations en estados tempranos
 *                  ('interested', 'deposit_paid') — interesados sin cerrar
 *  - Clientes:     owners (CRM) + puppy_reservations con status avanzados
 *                  ('assigned', 'contract_signed', 'paid_in_full', 'delivered')
 *                  deduplicados por email
 *
 * Sustituye la antigua /clientes (que solo mostraba CRM `owners`). La ruta
 * /clientes hace redirect a /contactos para no romper enlaces externos.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import ContactosPageClient, {
  type Subscriber,
  type Lead,
  type Client,
} from '@/components/contactos/contactos-page-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contactos · Genealogic' }

const LEAD_STATUSES = ['interested', 'deposit_paid'] as const
const CLIENT_STATUSES = ['assigned', 'contract_signed', 'paid_in_full', 'delivered'] as const

export default async function ContactosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    const t = getTranslator(await getLocale())
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">{t('Contactos')}</h1>
        <p className="text-body">
          {t('Para gestionar contactos necesitas un criadero registrado. Crea tu kennel desde')} <strong>{t('Mi Criadero')}</strong>.
        </p>
      </div>
    )
  }

  // Carga paralela — todo público (RLS lo limita al kennel del user)
  const [subsRes, leadsRes, clientReservationsRes, ownersRes] = await Promise.all([
    supabase
      .from('newsletter_subscribers')
      .select('id, email, full_name, source, tags, is_active, subscribed_at, unsubscribed_at')
      .eq('kennel_id', kennel.id)
      .order('subscribed_at', { ascending: false })
      .limit(500),
    supabase
      .from('puppy_reservations')
      .select(
        'id, applicant_name, applicant_email, applicant_phone, applicant_city, status, created_at, preference_sex, preference_color, deposit_amount_cents, currency, dog_id',
      )
      .eq('kennel_id', kennel.id)
      .in('status', LEAD_STATUSES as unknown as string[])
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('puppy_reservations')
      .select(
        'id, applicant_name, applicant_email, applicant_phone, applicant_city, status, delivered_at, created_at, updated_at, dog_id, total_price_cents, currency, dog:dogs!dog_id(id, name, slug, thumbnail_url)',
      )
      .eq('kennel_id', kennel.id)
      .in('status', CLIENT_STATUSES as unknown as string[])
      .order('updated_at', { ascending: false })
      .limit(500),
    supabase
      .from('owners')
      .select('id, full_name, email, phone, city, country, created_at, updated_at')
      .eq('kennel_id', kennel.id)
      .order('full_name')
      .limit(500),
  ])

  const subscribers: Subscriber[] = (subsRes.data || []) as Subscriber[]
  const leads: Lead[] = (leadsRes.data || []) as Lead[]

  // Clientes = owners + reservas avanzadas, deduplicadas por email
  // (un mismo cliente que cerró 2 perros sale solo una vez, pero con
  // contador de reservas y la más reciente como "última actividad").
  const clientsByEmail = new Map<string, Client>()

  // Primero los owners (CRM manual)
  for (const o of ownersRes.data || []) {
    const key = (o.email || `owner-${o.id}`).toLowerCase()
    clientsByEmail.set(key, {
      key,
      source: 'crm',
      full_name: o.full_name || '',
      email: o.email,
      phone: o.phone,
      city: o.city,
      country: o.country,
      last_activity: o.updated_at || o.created_at,
      reservations_count: 0,
      delivered_count: 0,
      last_dog: null,
      crm_owner_id: o.id,
    })
  }

  // Luego las reservas avanzadas — añaden info de perros, suman counts
  for (const r of (clientReservationsRes.data || []) as Array<{
    id: string
    applicant_name: string | null
    applicant_email: string | null
    applicant_phone: string | null
    applicant_city: string | null
    status: string
    delivered_at: string | null
    created_at: string
    updated_at: string
    dog_id: string | null
    total_price_cents: number | null
    currency: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dog: any
  }>) {
    const key = (r.applicant_email || `res-${r.id}`).toLowerCase()
    const existing = clientsByEmail.get(key)
    const dogData = Array.isArray(r.dog) ? r.dog[0] : r.dog
    const isDelivered = r.status === 'delivered'
    if (existing) {
      existing.reservations_count++
      if (isDelivered) existing.delivered_count++
      // Si la reserva es más reciente, actualizamos last_activity y last_dog
      const ts = r.updated_at || r.created_at
      if (!existing.last_activity || ts > existing.last_activity) {
        existing.last_activity = ts
        if (dogData) existing.last_dog = dogData
      }
    } else {
      clientsByEmail.set(key, {
        key,
        source: 'reservation',
        full_name: r.applicant_name || '',
        email: r.applicant_email,
        phone: r.applicant_phone,
        city: r.applicant_city,
        country: null,
        last_activity: r.updated_at || r.created_at,
        reservations_count: 1,
        delivered_count: isDelivered ? 1 : 0,
        last_dog: dogData || null,
        crm_owner_id: null,
      })
    }
  }

  const clients: Client[] = Array.from(clientsByEmail.values()).sort((a, b) =>
    (b.last_activity || '').localeCompare(a.last_activity || ''),
  )

  return (
    <ContactosPageClient
      kennelId={kennel.id}
      kennelName={kennel.name}
      subscribers={subscribers}
      leads={leads}
      clients={clients}
    />
  )
}
