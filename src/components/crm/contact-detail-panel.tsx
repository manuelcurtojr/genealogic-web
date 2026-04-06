'use client'

import { Mail, Phone, MapPin, Tag, FileText, HandCoins } from 'lucide-react'
import SlidePanel from '@/components/ui/slide-panel'

interface ContactDetailPanelProps {
  open: boolean
  onClose: () => void
  contact: any
  deals: any[]
  onEdit: () => void
}

export default function ContactDetailPanel({ open, onClose, contact, deals, onEdit }: ContactDetailPanelProps) {
  if (!contact) return null

  const contactDeals = deals.filter((d) => d.contact_id === contact.id)
  const initials = contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <SlidePanel open={open} onClose={onClose} title="Detalle del contacto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-lg font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">{contact.name}</h3>
          {contact.source && (
            <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{contact.source}</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3 mb-6">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm text-white/70 hover:text-[#D74709] transition">
            <Mail className="w-4 h-4 text-white/30" />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm text-white/70 hover:text-[#D74709] transition">
            <Phone className="w-4 h-4 text-white/30" />
            {contact.phone}
          </a>
        )}
        {contact.city && (
          <div className="flex items-center gap-3 text-sm text-white/60">
            <MapPin className="w-4 h-4 text-white/30" />
            {contact.city}
          </div>
        )}
        {contact.notes && (
          <div className="flex items-start gap-3 text-sm text-white/60">
            <FileText className="w-4 h-4 text-white/30 mt-0.5" />
            <p className="whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}
      </div>

      {/* Deals */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Negocios ({contactDeals.length})</h4>
        {contactDeals.length === 0 ? (
          <p className="text-sm text-white/30">Sin negocios asociados</p>
        ) : (
          <div className="space-y-2">
            {contactDeals.map((deal: any) => (
              <div key={deal.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-sm font-medium truncate">{deal.title}</p>
                {deal.value && (
                  <p className="text-sm text-[#D74709] font-semibold mt-1">{deal.value} {deal.currency || 'EUR'}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-lg text-sm font-medium transition"
        >
          Editar contacto
        </button>
      </div>
    </SlidePanel>
  )
}
