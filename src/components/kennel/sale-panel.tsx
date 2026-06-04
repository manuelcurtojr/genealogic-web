'use client'

import { useState, useEffect } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Tag, MapPin, DollarSign, Dog } from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { Img } from '@/components/ui/img'
import { useT } from '@/components/i18n/locale-provider'

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
  const t = useT()
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
    <Portal>
      <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div
        className={`fixed top-0 right-0 h-dvh w-full sm:max-w-xl z-[70] bg-white border-l border-hairline shadow-[-12px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 flex flex-col overflow-x-hidden ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
        style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline flex-shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-ink" />
            <h2 className="text-base sm:text-lg font-semibold">{t('Anuncio de venta')}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition"><X className="w-5 h-5" /></button>
        </div>

        {fetching ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

            {/* Dog info */}
            <div className="flex items-center gap-3 bg-surface-card border border-hairline rounded-xl p-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-card flex-shrink-0">
                {dog.thumbnail_url ? <Img w={200} src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Dog className="w-6 h-6 text-muted" /></div>}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{dog.name}</p>
                {dog.breed_name && <p className="text-xs text-muted truncate">{dog.breed_name}</p>}
              </div>
            </div>

            {/* Sale status */}
            <div className="flex items-center justify-between bg-surface-card border border-hairline rounded-xl p-4">
              <div>
                <p className="text-sm font-medium">{form.is_for_sale ? t('En venta') : t('No en venta')}</p>
                <p className="text-[11px] text-muted">{form.is_for_sale ? t('El anuncio esta activo') : t('Activa el anuncio para vender')}</p>
              </div>
              <ToggleSwitch value={form.is_for_sale} onChange={(v) => set('is_for_sale', v)} color="bg-green-500" />
            </div>

            {form.is_for_sale && (
              <>
                {/* Price section */}
                <div className="bg-surface-card border border-hairline rounded-xl p-4 space-y-3">
                  <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider">{t('Precio')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('Divisa')}</label>
                      <select value={form.sale_currency} onChange={e => set('sale_currency', e.target.value)}
                        className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-base sm:text-sm text-ink focus:border-ink focus:outline-none transition appearance-none">
                        {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('Precio total')}</label>
                      <input type="number" step="0.01" value={form.sale_price} onChange={e => set('sale_price', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('Reserva')}</label>
                      <input type="number" step="0.01" value={form.sale_reservation_price} onChange={e => set('sale_reservation_price', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition" />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-surface-card border border-hairline rounded-xl p-4 space-y-3">
                  <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" /> {t('Ubicacion')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('Código postal')}</label>
                      <input type="text" value={form.sale_zipcode} onChange={e => set('sale_zipcode', e.target.value)}
                        onBlur={lookupZipcode}
                        placeholder="28001"
                        className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('Ciudad, Pais')}</label>
                      <input type="text" value={form.sale_location} onChange={e => set('sale_location', e.target.value)}
                        placeholder="Madrid, Spain"
                        className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition" />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted">{t('Introduce el código postal para autocompletar la ubicacion')}</p>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('Descripcion del anuncio')}</label>
                  <textarea value={form.sale_description} onChange={e => set('sale_description', e.target.value)} rows={4}
                    placeholder={t('Describe el caracter, morfologia, vacunas incluidas, por que es especial...')}
                    className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition resize-none" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-hairline flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-body hover:text-ink hover:bg-surface-card transition">{t('Cancelar')}</button>
          <button onClick={handleSave} disabled={saving || fetching}
            className="bg-ink text-on-primary hover:opacity-90 font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t('Guardando...') : t('Guardar anuncio')}
          </button>
        </div>
      </div>
      </>
    </Portal>
  )
}
