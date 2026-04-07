'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, User, Palette, Hash } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface Props {
  litterId: string
  isOwner: boolean
}

export default function LitterWaitingList({ litterId, isOwner }: Props) {
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data } = await supabase
        .from('deals')
        .select('id, title, value, currency, is_reservation, advance_amount, payment_completed, preferred_sex, preferred_color, queue_position, contact:contacts(name, email)')
        .eq('litter_id', litterId)
        .order('queue_position', { ascending: true, nullsFirst: false })

      setDeals(data || [])
      setLoading(false)
    }
    fetch()
  }, [litterId])

  if (loading) return null
  if (deals.length === 0 && !isOwner) return null

  const sexLabel: Record<string, string> = { male: '♂ Macho', female: '♀ Hembra', any: 'Cualquiera' }
  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$' }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> Lista de espera ({deals.length})
      </h2>

      {deals.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/30">No hay interesados en la lista de espera</p>
          <p className="text-[10px] text-white/20 mt-1">Vincula un negocio a esta camada para que aparezca aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deals.map((deal, i) => {
            const contact = deal.contact as any
            const sexColor = deal.preferred_sex === 'male' ? BRAND.male : deal.preferred_sex === 'female' ? BRAND.female : 'rgba(255,255,255,0.3)'
            const position = deal.queue_position || i + 1
            const symbol = currencySymbol[deal.currency] || '€'

            return (
              <div key={deal.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                {/* Position badge */}
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-purple-400">{position}</span>
                </div>

                {/* Contact info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{contact?.name || deal.title}</p>
                    {deal.is_reservation && (
                      <span className="text-[9px] font-bold bg-[#D74709]/15 text-[#D74709] px-1.5 py-0.5 rounded-full">
                        RESERVA
                      </span>
                    )}
                    {deal.payment_completed && (
                      <span className="text-[9px] font-bold bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full">
                        PAGADO
                      </span>
                    )}
                  </div>
                  {isOwner && contact?.email && (
                    <p className="text-[10px] text-white/30 truncate">{contact.email}</p>
                  )}
                </div>

                {/* Preferences */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {deal.preferred_sex && deal.preferred_sex !== 'any' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sexColor + '15', color: sexColor }}>
                      {sexLabel[deal.preferred_sex]}
                    </span>
                  )}
                  {deal.preferred_color && (
                    <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                      <Palette className="w-2.5 h-2.5" />{deal.preferred_color}
                    </span>
                  )}
                  {deal.value && (
                    <span className="text-xs font-bold text-[#D74709]">
                      {Number(deal.value).toLocaleString('es-ES')} {symbol}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
