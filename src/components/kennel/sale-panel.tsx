'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Tag, MapPin, DollarSign, Dog } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  dog: { id: string; name: string; thumbnail_url: string | null; breed_name?: string } | null
}

const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'MXN', label: 'MXN ($)', symbol: '$' },
  { value: 'COP', label: 'COP ($)', symbol: '$' },
  { value: 'ARS', label: 'ARS ($)', symbol: '$' },
  { value: 'CLP', label: 'CLP ($)', symbol: '$' },
]

export default function SalePanel({ open, onClose, dog }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    is_for_sale: false,
    sale_currency: 'EUR',
    sale_price: '',
    sale_reservation_price: '',
    sale_zipcode: '',
    sale_location: '',
    sale_description: '',
  })

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    if (!open || !dog) return
    setFetching(true)
    setError('')
    const supabase = createClient()
    supabase.from('dogs')
      .select('is_for_sale, sale_currency, sale_price, sale_reservation_price, sale_zipcode, sale_location, sale_description')
      .eq('id', dog.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            is_for_sale: data.is_for_sale || false,
            sale_currency: data.sale_currency || 'EUR',
            sale_price: data.sale_price?.toString() || '',
            sale_reservation_price: data.sale_reservation_price?.toString() || '',
            sale_zipcode: data.sale_zipcode || '',
            sale_location: data.sale_location || '',
            sale_description: data.sale_description || '',
          })
        }
        setFetching(false)
      })
  }, [open, dog])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  async function lookupZipcode() {
    if (!form.sale_zipcode) return
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${form.sale_zipcode}&format=json&addressdetails=1&limit=1`)
      const data = await res.json()
      if (data?.[0]?.address) {
        const a = data[0].address
        const city = a.city || a.town || a.village || a.municipality || ''
        const country = a.country || ''
        if (city || country) set('sale_location', [city, country].filter(Boolean).join(', '))
      }
    } catch { /* ignore */ }
  }

  async function handleSave() {
    if (!dog) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.from('dogs').update({
      is_for_sale: form.is_for_sale,
      sale_currency: form.sale_currency,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      sale_reservation_price: form.sale_reservation_price ? parseFloat(form.sale_reservation_price) : null,
      sale_zipcode: form.sale_zipcode || null,
      sale_location: form.sale_location || null,
      sale_description: form.sale_description || null,
    }).eq('id', dog.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    onClose()
    router.refresh()
  }

  if (!dog) return null

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-xl z-[70] bg-ink-800 border-l border-hair shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-hair flex-shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#D74709]" />
            <h2 className="text-base sm:text-lg font-semibold">Anuncio de venta</h2>
          </div>
          <button onClick={onClose} className="text-fg-mute hover:text-fg transition"><X className="w-5 h-5" /></button>
        </div>

        {fetching ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-fg-mute" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

            {/* Dog info */}
            <div className="flex items-center gap-3 bg-chip border border-hair rounded-xl p-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-chip flex-shrink-0">
                {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Dog className="w-6 h-6 text-fg-mute" /></div>}
              </div>
              <div>
                <p className="text-sm font-semibold">{dog.name}</p>
                {dog.breed_name && <p className="text-xs text-fg-mute">{dog.breed_name}</p>}
              </div>
            </div>

            {/* Sale status */}
            <div className="flex items-center justify-between bg-chip border border-hair rounded-xl p-4">
              <div>
                <p className="text-sm font-medium">{form.is_for_sale ? 'En venta' : 'No en venta'}</p>
                <p className="text-[11px] text-fg-mute">{form.is_for_sale ? 'El anuncio esta activo' : 'Activa el anuncio para vender'}</p>
              </div>
              <ToggleSwitch value={form.is_for_sale} onChange={(v) => set('is_for_sale', v)} color="bg-green-500" />
            </div>

            {form.is_for_sale && (
              <>
                {/* Price section */}
                <div className="bg-ink-800 border border-hair rounded-xl p-4 space-y-3">
                  <h3 className="text-[11px] font-semibold text-fg-mute uppercase tracking-wider">Precio</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Divisa</label>
                      <select value={form.sale_currency} onChange={e => set('sale_currency', e.target.value)}
                        className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
                        {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Precio total</label>
                      <input type="number" step="0.01" value={form.sale_price} onChange={e => set('sale_price', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Reserva</label>
                      <input type="number" step="0.01" value={form.sale_reservation_price} onChange={e => set('sale_reservation_price', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-ink-800 border border-hair rounded-xl p-4 space-y-3">
                  <h3 className="text-[11px] font-semibold text-fg-mute uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" /> Ubicacion</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Código postal</label>
                      <input type="text" value={form.sale_zipcode} onChange={e => set('sale_zipcode', e.target.value)}
                        onBlur={lookupZipcode}
                        placeholder="28001"
                        className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Ciudad, Pais</label>
                      <input type="text" value={form.sale_location} onChange={e => set('sale_location', e.target.value)}
                        placeholder="Madrid, Spain"
                        className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
                    </div>
                  </div>
                  <p className="text-[10px] text-fg-mute">Introduce el código postal para autocompletar la ubicacion</p>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Descripcion del anuncio</label>
                  <textarea value={form.sale_description} onChange={e => set('sale_description', e.target.value)} rows={4}
                    placeholder="Describe el caracter, morfologia, vacunas incluidas, por que es especial..."
                    className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition resize-none" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-hair flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-chip transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving || fetching}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar anuncio'}
          </button>
        </div>
      </div>
    </>
  )
}
