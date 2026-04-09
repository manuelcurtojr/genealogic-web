'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Loader2, Check, Send, ChevronDown, Search } from 'lucide-react'
import WhatsAppIcon from '@/components/ui/whatsapp-icon'
import { getLocalizedCountries, searchCities } from '@/lib/countries'

interface FormField { id: string; label: string; type: 'text' | 'select' | 'file'; options?: string; required: boolean }

export default function PublicFormPage() {
  const { kennelId } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [kennel, setKennel] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [breeds, setBreeds] = useState<{ id: string; name: string }[]>([])

  const [data, setData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    country_code: '', country_name: '', city: '',
    breed_interests: [] as string[], dog_description: '',
  })
  const [customData, setCustomData] = useState<Record<string, string>>({})

  // Country/city search
  const countries = useMemo(() => getLocalizedCountries(), [])
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryQ, setCountryQ] = useState('')
  const [cityOpen, setCityOpen] = useState(false)
  const [cityQ, setCityQ] = useState('')
  const [cityResults, setCityResults] = useState<string[]>([])
  const [cityLoading, setCityLoading] = useState(false)

  const filteredCountries = countryQ
    ? countries.filter(c => c.name.toLowerCase().includes(countryQ.toLowerCase()))
    : countries

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [kennelRes, formRes] = await Promise.all([
        supabase.from('kennels').select('id, name, logo_url, whatsapp_enabled, whatsapp_phone, whatsapp_text, breed_ids').eq('id', kennelId).single(),
        supabase.from('kennel_forms').select('*').eq('kennel_id', kennelId).eq('is_active', true).limit(1),
      ])
      setKennel(kennelRes.data)
      const f = formRes.data?.[0]
      if (f) { setForm(f); setFields((f.fields as FormField[]) || []) }

      // Fetch breeds for this kennel
      if (kennelRes.data?.breed_ids?.length) {
        const { data: breedData } = await supabase.from('breeds').select('id, name').in('id', kennelRes.data.breed_ids).order('name')
        setBreeds(breedData || [])
      }
      setLoading(false)
    }
    load()
  }, [kennelId])

  const setField = (key: string, val: string) => setData(prev => ({ ...prev, [key]: val }))
  const setCustom = (id: string, val: string) => setCustomData(prev => ({ ...prev, [id]: val }))

  function selectCountry(code: string, name: string) {
    setData(prev => ({ ...prev, country_code: code, country_name: name, city: '' }))
    setCountryOpen(false)
    setCountryQ('')
    setCityResults([])
  }

  async function handleCitySearch(q: string) {
    setCityQ(q)
    if (q.length < 2 || !data.country_code) { setCityResults([]); return }
    setCityLoading(true)
    const results = await searchCities(data.country_code, q)
    setCityResults(results)
    setCityLoading(false)
    setCityOpen(results.length > 0)
  }

  function selectCity(city: string) {
    setField('city', city)
    setCityOpen(false)
    setCityQ('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.first_name.trim() || !data.email.trim() || !data.dog_description.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const submitData = {
        ...data,
        country: data.country_name,
        breed_interest_names: data.breed_interests.map(id => breeds.find(b => b.id === id)?.name || '').filter(Boolean).join(', '),
      }
      const res = await fetch('/api/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennelId, formId: form.id, data: submitData, customData }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al enviar')
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Error al enviar el formulario')
    }
    setSubmitting(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white/20" /></div>
  if (!kennel || !form) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center p-4"><div><p className="text-white/40 text-lg">Formulario no disponible</p></div></div>

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/15 mx-auto flex items-center justify-center mb-4"><Check className="w-10 h-10 text-green-400" /></div>
          <h1 className="text-2xl font-bold text-white mb-2">Solicitud enviada</h1>
          <p className="text-white/50 mb-6">Gracias por tu interes. El criador se pondra en contacto contigo.</p>
          {kennel.whatsapp_enabled && kennel.whatsapp_phone && (
            <a href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || `Hola, acabo de rellenar el formulario y me interesa un perro de ${kennel.name}`)}`}
              target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition">
              <WhatsAppIcon className="w-5 h-5" /> Contactar por WhatsApp
            </a>
          )}
        </div>
      </div>
    )
  }

  const selectedCountry = countries.find(c => c.code === data.country_code)

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 py-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          {kennel.logo_url && <img src={kennel.logo_url} alt="" className="w-16 h-16 rounded-xl mx-auto mb-3 object-cover" />}
          <h1 className="text-xl font-bold text-white">{kennel.name}</h1>
          <p className="text-white/40 text-sm mt-1">{form.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <PubField label="Nombre *" value={data.first_name} onChange={v => setField('first_name', v)} required />
            <PubField label="Apellidos" value={data.last_name} onChange={v => setField('last_name', v)} />
          </div>
          <PubField label="Email *" value={data.email} onChange={v => setField('email', v)} type="email" required />
          <PubField label="Telefono" value={data.phone} onChange={v => setField('phone', v)} type="tel" />

          {/* Country selector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Pais</label>
              <button type="button" onClick={() => { setCountryOpen(!countryOpen); setCityOpen(false) }}
                className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 transition ${countryOpen ? 'border-[#D74709]' : 'border-white/10'}`}>
                {selectedCountry ? (
                  <><span className="text-base">{selectedCountry.flag}</span><span className="text-white truncate flex-1 text-left">{selectedCountry.name}</span></>
                ) : (
                  <span className="text-white/25 flex-1 text-left">Seleccionar pais</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition ${countryOpen ? 'rotate-180' : ''}`} />
              </button>
              {countryOpen && (
                <div className="absolute z-30 mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-56 flex flex-col">
                  <div className="p-2 border-b border-white/5">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input autoFocus value={countryQ} onChange={e => setCountryQ(e.target.value)} placeholder="Buscar pais..."
                        className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {filteredCountries.map(c => (
                      <button key={c.code} type="button" onClick={() => selectCountry(c.code, c.name)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${c.code === data.country_code ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/70 hover:bg-white/5'}`}>
                        <span className="text-base">{c.flag}</span> {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* City selector */}
            <div className="relative">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Ciudad</label>
              <div className={`w-full bg-white/5 border rounded-lg transition ${!data.country_code ? 'opacity-40' : cityOpen ? 'border-[#D74709]' : 'border-white/10'}`}>
                <input type="text" value={data.city || cityQ} readOnly={!!data.city}
                  onChange={e => { if (!data.city) handleCitySearch(e.target.value) }}
                  onClick={() => { if (data.city) { setField('city', ''); setCityQ('') } }}
                  disabled={!data.country_code}
                  placeholder={data.country_code ? 'Buscar ciudad...' : 'Primero selecciona pais'}
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none" />
              </div>
              {cityOpen && cityResults.length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                  {cityResults.map(c => (
                    <button key={c} type="button" onClick={() => selectCity(c)}
                      className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5">{c}</button>
                  ))}
                </div>
              )}
              {cityLoading && <Loader2 className="absolute right-3 top-9 w-3.5 h-3.5 animate-spin text-white/20" />}
            </div>
          </div>

          {/* Breed interest */}
          {breeds.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Razas que te interesan</label>
              <div className="flex flex-wrap gap-1.5">
                {breeds.map(b => {
                  const selected = data.breed_interests.includes(b.id)
                  return (
                    <button key={b.id} type="button"
                      onClick={() => setData(prev => ({ ...prev, breed_interests: selected ? prev.breed_interests.filter(id => id !== b.id) : [...prev.breed_interests, b.id] }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${selected ? 'border-[#D74709] bg-[#D74709]/10 text-[#D74709]' : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20'}`}>
                      {b.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom fields */}
          {fields.map(field => (
            <div key={field.id}>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">{field.label}</label>
              {field.type === 'text' && (
                <input type="text" value={customData[field.id] || ''} onChange={e => setCustom(field.id, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
              )}
              {field.type === 'select' && (
                <select value={customData[field.id] || ''} onChange={e => setCustom(field.id, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
                  <option value="">Seleccionar...</option>
                  {field.options?.split(',').map(opt => <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>)}
                </select>
              )}
              {field.type === 'file' && (
                <input type="file" className="w-full text-sm text-white/50 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#D74709]/10 file:text-[#D74709] hover:file:bg-[#D74709]/20" />
              )}
            </div>
          ))}

          {/* Dog description - always last, always required */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Describe el perro que buscas *</label>
            <textarea value={data.dog_description} onChange={e => setField('dog_description', e.target.value)} rows={3} required
              placeholder="Sexo, color, caracter, uso previsto, cuando lo necesitas..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none" />
          </div>

          <button type="submit" disabled={submitting || !data.first_name.trim() || !data.email.trim() || !data.dog_description.trim()}
            className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
          <p className="text-[10px] text-white/20 text-center">Los campos marcados con * son obligatorios</p>
        </form>
        <p className="text-center text-[10px] text-white/15 mt-4">Powered by Genealogic</p>
      </div>
    </div>
  )
}

function PubField({ label, value, onChange, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}
