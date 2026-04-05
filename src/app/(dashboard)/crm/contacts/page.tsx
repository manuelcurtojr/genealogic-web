import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, Mail, Phone, MapPin } from 'lucide-react'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Contactos</h1>
          <p className="text-white/50 text-sm mt-1">{contacts?.length || 0} contactos</p>
        </div>
        <button className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
          <Plus className="w-4 h-4" /> Nuevo contacto
        </button>
      </div>

      {!contacts || contacts.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No tienes contactos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact: any) => (
            <div key={contact.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-sm font-bold flex-shrink-0">
                {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white">{contact.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
                  {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
                  {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                  {contact.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{contact.city}</span>}
                </div>
              </div>
              {contact.source && (
                <span className="text-[11px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{contact.source}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
