'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { History, Clock } from 'lucide-react'

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre', sex: 'Sexo', birth_date: 'Nacimiento', registration: 'Registro',
  microchip: 'Microchip', weight: 'Peso', height: 'Altura', breed_id: 'Raza',
  color_id: 'Color', kennel_id: 'Criadero', father_id: 'Padre', mother_id: 'Madre',
  is_public: 'Visibilidad', thumbnail_url: 'Foto principal',
  is_for_sale: 'En venta', sale_price: 'Precio', sale_location: 'Ubicación',
  breeder_id: 'Criador', owner_id: 'Propietario',
  photo_added: 'Foto añadida', photo_removed: 'Foto eliminada',
  verified: 'Perfil verificado',
}

// Fields where the value is a URL (show "foto" instead of the URL)
const URL_FIELDS = new Set(['photo_added', 'photo_removed', 'thumbnail_url'])

export default function HistorialTab({ dogId }: { dogId: string }) {
  const [changes, setChanges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('dog_changes').select('*').eq('dog_id', dogId).order('created_at', { ascending: false }).limit(50)
      setChanges(data || [])
      setLoading(false)
    }
    load()
  }, [dogId])

  if (loading) return <div className="text-center py-8 text-white/30 text-sm">Cargando historial...</div>

  if (changes.length === 0) return (
    <div className="text-center py-12 text-white/30">
      <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No hay cambios registrados para este perro.</p>
      <p className="text-xs text-white/20 mt-1">Los cambios se registraran a partir de ahora.</p>
    </div>
  )

  // Group by date
  const grouped = changes.reduce((acc: Record<string, any[]>, c) => {
    const day = new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!acc[day]) acc[day] = []
    acc[day].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day}>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">{day}</p>
          <div className="space-y-1.5">
            {(items as any[]).map(c => (
              <div key={c.id} className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-3">
                <Clock className="w-3.5 h-3.5 text-white/20 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60">
                    <span className="font-semibold text-white/80">{FIELD_LABELS[c.field_name] || c.field_name}</span>
                    {c.field_name === 'photo_added' ? '' : c.field_name === 'photo_removed' ? '' : ' cambiado'}
                  </p>
                  {URL_FIELDS.has(c.field_name) ? (
                    <div className="flex items-center gap-2 mt-1">
                      {c.new_value && <img src={c.new_value} alt="" className="w-10 h-10 rounded-md object-cover" />}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.old_value && <span className="text-[11px] text-red-400/60 line-through truncate max-w-[120px]">{c.old_value}</span>}
                      {c.old_value && c.new_value && <span className="text-[10px] text-white/20">&rarr;</span>}
                      {c.new_value && <span className="text-[11px] text-green-400/60 truncate max-w-[120px]">{c.new_value}</span>}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-white/20 flex-shrink-0">
                  {new Date(c.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
