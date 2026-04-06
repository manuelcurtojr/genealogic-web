'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Loader2, Check, Send, MessageCircle } from 'lucide-react'

interface FormField {
  id: string
  label: string
  type: 'text' | 'select' | 'file'
  options?: string
  required: boolean
}

export default function PublicFormPage() {
  const { kennelId } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [kennel, setKennel] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [fields, setFields] = useState<FormField[]>([])

  // Fixed fields
  const [data, setData] = useState({
    first_name: '', last_name: '', email: '', phone: '', city: '', country: '', dog_description: '',
  })
  // Country search
  const [countrySearch, setCountrySearch] = useState('')
  const [countryResults, setCountryResults] = useState<string[]>([])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [cityResults, setCityResults] = useState<string[]>([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  // Custom field values
  const [customData, setCustomData] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [kennelRes, formRes] = await Promise.all([
        supabase.from('kennels').select('id, name, logo_url, whatsapp_enabled, whatsapp_phone, whatsapp_text').eq('id', kennelId).single(),
        supabase.from('kennel_forms').select('*').eq('kennel_id', kennelId).eq('is_active', true).limit(1),
      ])
      setKennel(kennelRes.data)
      const f = formRes.data?.[0]
      if (f) {
        setForm(f)
        setFields((f.fields as FormField[]) || [])
      }
      setLoading(false)
    }
    load()
  }, [kennelId])

  const setField = (key: string, val: string) => setData(prev => ({ ...prev, [key]: val }))
  const setCustom = (id: string, val: string) => setCustomData(prev => ({ ...prev, [id]: val }))

  async function searchCountries(q: string) {
    setCountrySearch(q)
    setField('country', q)
    if (q.length < 2) { setCountryResults([]); setShowCountryDropdown(false); return }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&featuretype=country`)
      const data = await res.json()
      const countries = [...new Set(data.map((r: any) => r.address?.country).filter(Boolean))] as string[]
      setCountryResults(countries)
      setShowCountryDropdown(countries.length > 0)
    } catch { setCountryResults([]) }
  }

  async function searchCities(q: string) {
    setCitySearch(q)
    setField('city', q)
    if (q.length < 2 || !data.country) { setCityResults([]); setShowCityDropdown(false); return }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(q)}&country=${encodeURIComponent(data.country)}&format=json&addressdetails=1&limit=5`)
      const results = await res.json()
      const cities = [...new Set(results.map((r: any) => r.address?.city || r.address?.town || r.address?.village).filter(Boolean))] as string[]
      setCityResults(cities)
      setShowCityDropdown(cities.length > 0)
    } catch { setCityResults([]) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.first_name.trim() || !data.email.trim() || !data.dog_description.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennelId,
          formId: form.id,
          data,
          customData,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al enviar')
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Error al enviar el formulario')
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white/20" /></div>
  }

  if (!kennel || !form) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center p-4">
        <div>
          <p className="text-white/40 text-lg">Formulario no disponible</p>
          <p className="text-white/20 text-sm mt-2">Este criadero no tiene un formulario activo</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/15 mx-auto flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Solicitud enviada</h1>
          <p className="text-white/50 mb-6">Gracias por tu interes. El criador se pondra en contacto contigo.</p>
          {kennel.whatsapp_enabled && kennel.whatsapp_phone && (
            <a
              href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}?text=${encodeURIComponent(kennel.whatsapp_text || `Hola, acabo de rellenar el formulario y me interesa un perro de ${kennel.name}`)}`}
              target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              <MessageCircle className="w-5 h-5" /> Contactar por WhatsApp
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          {kennel.logo_url && (
            <img src={kennel.logo_url} alt="" className="w-16 h-16 rounded-xl mx-auto mb-3 object-cover" />
          )}
          <h1 className="text-xl font-bold text-white">{kennel.name}</h1>
          <p className="text-white/40 text-sm mt-1">{form.name}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {/* Fixed fields */}
          <div className="grid grid-cols-2 gap-3">
            <PubField label="Nombre *" value={data.first_name} onChange={v => setField('first_name', v)} required />
            <PubField label="Apellidos" value={data.last_name} onChange={v => setField('last_name', v)} />
          </div>
          <PubField label="Email *" value={data.email} onChange={v => setField('email', v)} type="email" required />
          <PubField label="Telefono" value={data.phone} onChange={v => setField('phone', v)} type="tel" />

          {/* Country + City search */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Pais</label>
              <input type="text" value={data.country} onChange={e => searchCountries(e.target.value)}
                onFocus={() => countryResults.length > 0 && setShowCountryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                placeholder="Buscar pais..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
              {showCountryDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                  {countryResults.map(c => (
                    <button key={c} type="button" onMouseDown={() => { setField('country', c); setCountrySearch(c); setShowCountryDropdown(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5">{c}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Ciudad</label>
              <input type="text" value={data.city} onChange={e => searchCities(e.target.value)}
                onFocus={() => cityResults.length > 0 && setShowCityDropdown(true)}
                onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                placeholder={data.country ? 'Buscar ciudad...' : 'Primero selecciona pais'}
                disabled={!data.country}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition disabled:opacity-40" />
              {showCityDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                  {cityResults.map(c => (
                    <button key={c} type="button" onMouseDown={() => { setField('city', c); setCitySearch(c); setShowCityDropdown(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5">{c}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dog description - always required */}
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Describe el perro que buscas *</label>
            <textarea value={data.dog_description} onChange={e => setField('dog_description', e.target.value)} rows={3} required
              placeholder="Sexo, color, caracter, uso previsto, cuando lo necesitas..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none" />
          </div>

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

          <button type="submit" disabled={submitting || !data.first_name.trim() || !data.email.trim()}
            className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
          <p className="text-[10px] text-white/20 text-center mt-2">Los campos marcados con * son obligatorios</p>
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
