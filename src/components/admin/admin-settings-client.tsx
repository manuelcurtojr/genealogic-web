'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Key, Eye, EyeOff, Check, Loader2, Plus, Trash2, Shield } from 'lucide-react'

interface Setting {
  id: string
  key: string
  value: string
  description: string | null
  updated_at: string
}

interface Props { settings: Setting[] }

const KNOWN_KEYS = [
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic (Claude AI)', description: 'Necesaria para el importador de pedigrís con IA. Se obtiene en console.anthropic.com', placeholder: 'sk-ant-...' },
  { key: 'APIFLASH_KEY', label: 'ApiFlash (Screenshots)', description: 'Para capturar screenshots de webs de pedigrís. Se obtiene en apiflash.com', placeholder: 'xxxxxxxxxxxxxxxx' },
  { key: 'STRIPE_SECRET_KEY', label: 'Stripe (Pagos)', description: 'Para procesar pagos de planes y genes. Se obtiene en dashboard.stripe.com', placeholder: 'sk_live_...' },
  { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', description: 'Para verificar webhooks de Stripe', placeholder: 'whsec_...' },
]

export default function AdminSettingsClient({ settings: initSettings }: Props) {
  const [settings, setSettings] = useState(initSettings)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customKey, setCustomKey] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [customDesc, setCustomDesc] = useState('')

  const toggleVisible = (key: string) => {
    const next = new Set(visibleKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setVisibleKeys(next)
  }

  const getSettingValue = (key: string) => settings.find(s => s.key === key)?.value || ''
  const getSettingId = (key: string) => settings.find(s => s.key === key)?.id
  const getEditValue = (key: string) => editValues[key] ?? getSettingValue(key)

  const saveSetting = async (key: string) => {
    const value = getEditValue(key)
    setSaving(key)
    const supabase = createClient()

    const existingId = getSettingId(key)
    const knownInfo = KNOWN_KEYS.find(k => k.key === key)

    if (existingId) {
      await supabase.from('platform_settings').update({ value, updated_at: new Date().toISOString() }).eq('id', existingId)
    } else {
      await supabase.from('platform_settings').insert({
        key,
        value,
        description: knownInfo?.description || null,
      })
    }

    // Refresh
    const { data } = await supabase.from('platform_settings').select('id, key, value, description, updated_at').order('key')
    setSettings(data || [])
    setEditValues(prev => { const next = { ...prev }; delete next[key]; return next })
    setSaving(null)
  }

  const deleteSetting = async (key: string) => {
    const existingId = getSettingId(key)
    if (!existingId) return
    const supabase = createClient()
    await supabase.from('platform_settings').delete().eq('id', existingId)
    setSettings(prev => prev.filter(s => s.key !== key))
  }

  const addCustom = async () => {
    if (!customKey.trim() || !customValue.trim()) return
    setSaving('custom')
    const supabase = createClient()
    await supabase.from('platform_settings').insert({
      key: customKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      value: customValue.trim(),
      description: customDesc.trim() || null,
    })
    const { data } = await supabase.from('platform_settings').select('id, key, value, description, updated_at').order('key')
    setSettings(data || [])
    setCustomKey('')
    setCustomValue('')
    setCustomDesc('')
    setShowAddCustom(false)
    setSaving(null)
  }

  // Merge known keys with existing settings
  const allKeys = [
    ...KNOWN_KEYS,
    ...settings.filter(s => !KNOWN_KEYS.find(k => k.key === s.key)).map(s => ({
      key: s.key, label: s.key, description: s.description || '', placeholder: ''
    })),
  ]

  const maskValue = (val: string) => {
    if (!val) return ''
    if (val.length <= 8) return '••••••••'
    return val.slice(0, 4) + '••••••••' + val.slice(-4)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configuración de plataforma</h1>
          <p className="text-white/40 text-sm">API keys y configuración de servicios externos</p>
        </div>
        <button onClick={() => setShowAddCustom(!showAddCustom)}
          className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition">
          <Plus className="w-4 h-4" /> Clave personalizada
        </button>
      </div>

      {/* Security notice */}
      <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-400">Las API keys se almacenan cifradas en la base de datos</p>
          <p className="text-xs text-white/30 mt-0.5">Solo los administradores pueden ver y modificar estas claves. Se usan en el servidor, nunca se envían al navegador del usuario.</p>
        </div>
      </div>

      {/* Add custom key form */}
      {showAddCustom && (
        <div className="bg-white/5 border border-[#D74709]/20 rounded-xl p-5 mb-4 space-y-3">
          <p className="text-sm font-semibold">Añadir clave personalizada</p>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" value={customKey} onChange={e => setCustomKey(e.target.value)}
              placeholder="NOMBRE_CLAVE" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none font-mono" />
            <input type="text" value={customValue} onChange={e => setCustomValue(e.target.value)}
              placeholder="Valor" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
            <input type="text" value={customDesc} onChange={e => setCustomDesc(e.target.value)}
              placeholder="Descripción (opcional)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={addCustom} disabled={!customKey.trim() || !customValue.trim() || saving === 'custom'}
              className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">Añadir</button>
            <button onClick={() => setShowAddCustom(false)} className="text-white/50 hover:text-white px-4 py-2 text-sm transition">Cancelar</button>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="space-y-3">
        {allKeys.map(k => {
          const currentValue = getSettingValue(k.key)
          const editValue = getEditValue(k.key)
          const isVisible = visibleKeys.has(k.key)
          const hasChanged = editValues[k.key] !== undefined && editValues[k.key] !== currentValue
          const isConfigured = !!currentValue

          return (
            <div key={k.key} className={`bg-white/5 border rounded-xl p-5 transition ${isConfigured ? 'border-green-500/20' : 'border-white/10'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className={`w-4 h-4 ${isConfigured ? 'text-green-400' : 'text-white/30'}`} />
                    <h3 className="text-sm font-semibold">{k.label}</h3>
                    {isConfigured && <span className="text-[9px] font-bold bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full">CONFIGURADA</span>}
                  </div>
                  <p className="text-xs text-white/30 mt-1">{k.description}</p>
                </div>
                {isConfigured && !KNOWN_KEYS.find(kk => kk.key === k.key) && (
                  <button onClick={() => deleteSetting(k.key)} className="text-white/20 hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={isVisible ? 'text' : 'password'}
                    value={editValue}
                    onChange={e => setEditValues(prev => ({ ...prev, [k.key]: e.target.value }))}
                    placeholder={k.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#D74709] focus:outline-none transition font-mono pr-10"
                  />
                  <button onClick={() => toggleVisible(k.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={() => saveSetting(k.key)} disabled={!hasChanged && isConfigured || saving === k.key}
                  className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-30 flex items-center gap-1.5 flex-shrink-0">
                  {saving === k.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Guardar
                </button>
              </div>

              {currentValue && (
                <p className="text-[10px] text-white/20 mt-2">
                  Valor actual: {isVisible ? currentValue : maskValue(currentValue)}
                  {settings.find(s => s.key === k.key)?.updated_at && (
                    <> · Actualizado: {new Date(settings.find(s => s.key === k.key)!.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</>
                  )}
                </p>
              )}

              <p className="text-[10px] text-white/15 mt-1 font-mono">{k.key}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
