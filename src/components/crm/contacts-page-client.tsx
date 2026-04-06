'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Users, Mail, Phone, MapPin, Search } from 'lucide-react'
import ContactForm from './contact-form'
import ContactDetailPanel from './contact-detail-panel'

interface ContactsPageClientProps {
  initialContacts: any[]
  initialDeals: any[]
  userId: string
}

export default function ContactsPageClient({ initialContacts, initialDeals, userId }: ContactsPageClientProps) {
  const [contacts, setContacts] = useState(initialContacts)
  const [deals] = useState(initialDeals)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  // Form / detail state
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)

  const fetchContacts = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
    setContacts(data || [])
  }, [userId])

  const filtered = contacts.filter((c) => {
    if (search) {
      const q = search.toLowerCase()
      if (!c.name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q) && !c.phone?.includes(q) && !c.city?.toLowerCase().includes(q)) return false
    }
    if (sourceFilter && c.source !== sourceFilter) return false
    return true
  })

  const handleContactClick = (contact: any) => {
    setSelectedContact(contact)
    setShowDetail(true)
  }

  const handleEdit = (contact?: any) => {
    setEditingContact(contact || selectedContact)
    setShowDetail(false)
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingContact(null)
    setShowForm(true)
  }

  const sources = [...new Set(contacts.map(c => c.source).filter(Boolean))]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contactos</h1>
          <p className="text-white/50 text-sm mt-1">{contacts.length} contactos</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Nuevo contacto
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text" placeholder="Buscar contacto..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition"
          />
        </div>
        <select
          value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none cursor-pointer"
        >
          <option value="">Todos los origenes</option>
          {sources.map((s: any) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">{contacts.length === 0 ? 'No tienes contactos' : 'Sin resultados'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact: any) => (
            <div
              key={contact.id}
              onClick={() => handleContactClick(contact)}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#D74709]/50 hover:bg-white/[0.07] transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-sm font-bold flex-shrink-0">
                {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white">{contact.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
                  {contact.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 flex-shrink-0" />{contact.email}</span>}
                  {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 flex-shrink-0" />{contact.phone}</span>}
                  {contact.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{contact.city}</span>}
                </div>
              </div>
              {contact.source && (
                <span className="text-[11px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full flex-shrink-0">{contact.source}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contact form modal */}
      {showForm && (
        <ContactForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingContact(null) }}
          onSaved={fetchContacts}
          initialData={editingContact}
          userId={userId}
        />
      )}

      {/* Contact detail panel */}
      <ContactDetailPanel
        open={showDetail}
        onClose={() => { setShowDetail(false); setSelectedContact(null) }}
        contact={selectedContact}
        deals={deals}
        onEdit={() => handleEdit()}
      />
    </div>
  )
}
