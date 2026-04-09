'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Inbox, Mail, Phone, Loader2, ArrowLeft, Copy, Check, User, Pencil, ExternalLink, Calendar, Tag } from 'lucide-react'
import WhatsAppIcon from '@/components/ui/whatsapp-icon'
import { roleAtLeast } from '@/lib/permissions'
import PlanGate from '@/components/ui/plan-gate'
import ContactForm from '@/components/crm/contact-form'

// We need userId for ContactForm

interface Submission {
  id: string
  data: any
  contact_id: string | null
  deal_id: string | null
  is_read?: boolean
  created_at: string
  contact?: { id: string; name: string; email: string | null; phone: string | null; city: string | null; country: string | null }
}

export default function InboxPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [userId, setUserId] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || 'free'
    setUserRole(role)
    if (!roleAtLeast(role, 'amateur')) { setLoading(false); return }

    const { data: kennel } = await supabase.from('kennels').select('id').eq('owner_id', user.id).single()
    if (!kennel) { setLoading(false); return }

    const { data } = await supabase
      .from('form_submissions')
      .select('id, data, contact_id, deal_id, created_at')
      .eq('kennel_id', kennel.id)
      .order('created_at', { ascending: false })
      .limit(200)

    if (data?.length) {
      const contactIds = [...new Set(data.filter(s => s.contact_id).map(s => s.contact_id!))]
      const { data: contacts } = contactIds.length
        ? await supabase.from('contacts').select('id, name, email, phone, city, country').in('id', contactIds)
        : { data: [] }
      const contactMap = Object.fromEntries((contacts || []).map(c => [c.id, c]))
      setSubmissions(data.map(s => ({ ...s, contact: s.contact_id ? contactMap[s.contact_id] : undefined })))
    }
    setLoading(false)
  }

  async function markAsRead(id: string) {
    const sub = submissions.find(s => s.id === id)
    if (!sub || sub.is_read) return
    const supabase = createClient()
    // is_read column may not exist yet — ignore errors
    await supabase.from('form_submissions').update({ is_read: true } as any).eq('id', id).then(() => {})
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_read: true } : s))
  }

  function selectSubmission(id: string) {
    setSelectedId(id)
    markAsRead(id)
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  function getWhatsAppUrl(phone: string, name: string) {
    const clean = phone.replace(/[^0-9+]/g, '')
    const num = clean.startsWith('+') ? clean.slice(1) : clean.startsWith('34') ? clean : '34' + clean
    return `https://wa.me/${num}?text=${encodeURIComponent(`Hola ${name}, gracias por tu interés. `)}`
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Ayer'
    if (days < 7) return `${days}d`
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  if (userRole && !roleAtLeast(userRole, 'amateur')) {
    return <PlanGate requiredPlan="amateur" featureName="Bandeja de solicitudes" featureDescription="Recibe y gestiona las solicitudes de tu formulario de contacto." />
  }

  const selected = submissions.find(s => s.id === selectedId)
  const unreadCount = submissions.filter(s => !s.is_read).length

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-white/20" /></div>

  // ─── MOBILE: show detail view ───
  if (selected && typeof window !== 'undefined' && window.innerWidth < 1024) {
    return (
      <div>
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-4 transition">
          <ArrowLeft className="w-4 h-4" /> Solicitudes
        </button>
        <DetailView
          sub={selected}
          copied={copied}
          onCopy={copyToClipboard}
          getWhatsAppUrl={getWhatsAppUrl}
          onEditContact={() => { setEditingContact(selected.contact); setContactFormOpen(true) }}
        />
        <ContactForm open={contactFormOpen} onClose={() => setContactFormOpen(false)} initialData={editingContact} onSaved={load} userId={userId} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Solicitudes</h1>
          {unreadCount > 0 && (
            <span className="bg-[#D74709] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
          )}
        </div>
        <span className="text-xs text-white/30">{submissions.length} total</span>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <Inbox className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No tienes solicitudes</p>
          <p className="text-xs text-white/20 mt-1">Aparecerán aquí cuando alguien complete tu formulario</p>
        </div>
      ) : (
        <div className="flex gap-0 lg:gap-0 border border-white/10 rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Left: submission list */}
          <div className="w-full lg:w-[380px] lg:min-w-[320px] border-r border-white/10 overflow-y-auto bg-white/[0.01]">
            {submissions.map(sub => {
              const formData = sub.data || {}
              const name = sub.contact?.name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'Sin nombre'
              const breed = formData.breed_interest_names || ''
              const preview = formData.dog_description || formData.message || ''
              const isSelected = sub.id === selectedId
              const isUnread = !sub.is_read

              return (
                <button
                  key={sub.id}
                  onClick={() => selectSubmission(sub.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition ${
                    isSelected
                      ? 'bg-[#D74709]/10 border-l-2 border-l-[#D74709]'
                      : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Unread indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      {isUnread ? (
                        <div className="w-2 h-2 rounded-full bg-[#D74709]" />
                      ) : (
                        <div className="w-2 h-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : 'text-white/60'}`}>{name}</p>
                        <span className="text-[10px] text-white/25 flex-shrink-0">{timeAgo(sub.created_at)}</span>
                      </div>
                      {breed && <p className="text-xs text-[#D74709]/70 truncate mt-0.5">{breed}</p>}
                      {preview && <p className="text-xs text-white/30 truncate mt-0.5">{preview}</p>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: detail panel (desktop only) */}
          <div className="hidden lg:flex flex-1 flex-col overflow-y-auto">
            {selected ? (
              <DetailView
                sub={selected}
                copied={copied}
                onCopy={copyToClipboard}
                getWhatsAppUrl={getWhatsAppUrl}
                onEditContact={() => { setEditingContact(selected.contact); setContactFormOpen(true) }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                <Inbox className="w-16 h-16 mb-3 opacity-20" />
                <p className="text-sm">Selecciona una solicitud</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ContactForm open={contactFormOpen} onClose={() => setContactFormOpen(false)} initialData={editingContact} onSaved={load} userId={userId} />
    </div>
  )
}

// ─── Detail View Component ───
function DetailView({ sub, copied, onCopy, getWhatsAppUrl, onEditContact }: {
  sub: Submission
  copied: string | null
  onCopy: (text: string, field: string) => void
  getWhatsAppUrl: (phone: string, name: string) => string
  onEditContact: () => void
}) {
  const formData = sub.data || {}
  const contact = sub.contact
  const name = contact?.name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || 'Sin nombre'
  const email = contact?.email || formData.email
  const phone = contact?.phone || formData.phone
  const location = [contact?.city || formData.city, contact?.country || formData.country].filter(Boolean).join(', ')
  const breed = formData.breed_interest_names
  const description = formData.dog_description || formData.message
  const customData = formData.custom || {}
  const hasCustom = Object.keys(customData).length > 0

  return (
    <div className="flex-1 flex flex-col">
      {/* Contact banner */}
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-[#D74709]/15 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[#D74709]">{name[0]?.toUpperCase() || '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white">{name}</p>
            {location && <p className="text-xs text-white/30 mt-0.5">{location}</p>}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {email && (
                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
                  <Mail className="w-3 h-3 text-white/30" />
                  <a href={`mailto:${email}`} className="text-xs text-white/60 hover:text-[#D74709] transition">{email}</a>
                  <button onClick={() => onCopy(email, 'email')} className="p-0.5 rounded hover:bg-white/10">
                    {copied === 'email' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/20" />}
                  </button>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
                  <Phone className="w-3 h-3 text-white/30" />
                  <span className="text-xs text-white/60">{phone}</span>
                  <button onClick={() => onCopy(phone, 'phone')} className="p-0.5 rounded hover:bg-white/10">
                    {copied === 'phone' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/20" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {contact && (
            <button onClick={onEditContact} className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/60 px-3 py-1.5 rounded-lg transition">
              <Pencil className="w-3 h-3" /> Editar contacto
            </button>
          )}
          {phone && (
            <a href={getWhatsAppUrl(phone, name)} target="_blank" rel="noopener"
              className="flex items-center gap-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg transition">
              <WhatsAppIcon className="w-3 h-3" /> WhatsApp
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`}
              className="flex items-center gap-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg transition">
              <Mail className="w-3 h-3" /> Email
            </a>
          )}
          {sub.deal_id && (
            <a href={`/crm/deals`}
              className="flex items-center gap-1.5 text-xs bg-[#D74709]/10 hover:bg-[#D74709]/20 text-[#D74709] px-3 py-1.5 rounded-lg transition">
              <ExternalLink className="w-3 h-3" /> Ver negocio
            </a>
          )}
        </div>
      </div>

      {/* Submission content */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        {/* Date */}
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-3.5 h-3.5 text-white/20" />
          <span className="text-xs text-white/30">
            {new Date(sub.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Breed interest */}
        {breed && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="w-3.5 h-3.5 text-[#D74709]/50" />
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Raza de interés</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {breed.split(',').map((b: string, i: number) => (
                <span key={i} className="bg-[#D74709]/10 text-[#D74709] text-xs font-medium px-2.5 py-1 rounded-full">{b.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description / message */}
        {description && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Mensaje</p>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>
          </div>
        )}

        {/* Custom fields */}
        {hasCustom && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Campos adicionales</p>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
              {Object.entries(customData).map(([key, value]) => (
                value ? (
                  <div key={key} className="flex items-start gap-2">
                    <span className="text-xs text-white/40 min-w-[100px]">{key}:</span>
                    <span className="text-sm text-white/70">{String(value)}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        {/* No description/message */}
        {!description && !breed && !hasCustom && (
          <div className="text-center py-8 text-white/20">
            <p className="text-sm">Solo datos de contacto — sin mensaje adicional</p>
          </div>
        )}
      </div>
    </div>
  )
}
