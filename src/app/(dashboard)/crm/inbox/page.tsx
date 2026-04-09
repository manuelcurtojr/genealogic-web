'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Inbox, Mail, Phone, Loader2, ExternalLink, Calendar } from 'lucide-react'
import { roleAtLeast } from '@/lib/permissions'
import PlanGate from '@/components/ui/plan-gate'
import WhatsAppIcon from '@/components/ui/whatsapp-icon'

interface Submission {
  id: string
  data: any
  contact_id: string | null
  created_at: string
  contact?: { name: string; email: string | null; phone: string | null; city: string | null; country: string | null }
}

export default function InboxPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || 'free'
    setUserRole(role)
    if (!roleAtLeast(role, 'amateur')) { setLoading(false); return }

    // Get kennel
    const { data: kennel } = await supabase.from('kennels').select('id').eq('owner_id', user.id).single()
    if (!kennel) { setLoading(false); return }

    // Get form submissions for this kennel
    const { data } = await supabase
      .from('form_submissions')
      .select('id, data, contact_id, created_at')
      .eq('kennel_id', kennel.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (data?.length) {
      // Fetch contacts
      const contactIds = [...new Set(data.filter(s => s.contact_id).map(s => s.contact_id!))]
      const { data: contacts } = contactIds.length
        ? await supabase.from('contacts').select('id, name, email, phone, city, country').in('id', contactIds)
        : { data: [] }

      const contactMap = Object.fromEntries((contacts || []).map(c => [c.id, c]))
      setSubmissions(data.map(s => ({ ...s, contact: s.contact_id ? contactMap[s.contact_id] : undefined })))
    }

    setLoading(false)
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Ayer'
    if (days < 7) return `Hace ${days} días`
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  if (userRole && !roleAtLeast(userRole, 'amateur')) {
    return <PlanGate requiredPlan="amateur" featureName="Bandeja de solicitudes" featureDescription="Recibe y gestiona las solicitudes de tu formulario de contacto." />
  }

  function getWhatsAppUrl(phone: string, name: string) {
    const clean = phone.replace(/[^0-9+]/g, '')
    const num = clean.startsWith('+') ? clean.slice(1) : clean.startsWith('34') ? clean : '34' + clean
    return `https://wa.me/${num}?text=${encodeURIComponent(`Hola ${name}, gracias por tu interés. `)}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Solicitudes</h1>
          <p className="text-xs text-white/40 mt-1">Solicitudes recibidas desde tu formulario de contacto</p>
        </div>
        <span className="text-xs text-white/30 bg-white/5 px-2.5 py-1 rounded-full">{submissions.length} total</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <Inbox className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No tienes solicitudes</p>
          <p className="text-xs text-white/20 mt-1">Las solicitudes aparecerán aquí cuando alguien complete tu formulario</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => {
            const contact = sub.contact
            const formData = sub.data || {}
            const name = contact?.name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'Sin nombre'
            const email = contact?.email || formData.email
            const phone = contact?.phone || formData.phone
            const location = [contact?.city || formData.city, contact?.country || formData.country].filter(Boolean).join(', ')

            return (
              <div key={sub.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{name}</p>
                      <span className="text-[10px] text-white/25">{timeAgo(sub.created_at)}</span>
                    </div>
                    {location && <p className="text-xs text-white/30 mt-0.5">{location}</p>}

                    {/* Breed interest */}
                    {formData.breed_interest_names && (
                      <p className="text-xs text-[#D74709]/80 mt-1">Interesado en: {formData.breed_interest_names}</p>
                    )}
                    {formData.dog_description && (
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">{formData.dog_description}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/40 hover:text-blue-400"
                        title="Enviar email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {phone && (
                      <a
                        href={getWhatsAppUrl(phone, name)}
                        target="_blank"
                        rel="noopener"
                        className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition text-green-400"
                        title="WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Contact details row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                  {email && <span>{email}</span>}
                  {phone && <span>{phone}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
