'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Copy, Check, Trash2, Key, AlertTriangle, ExternalLink } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key_last4: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export default function KennelApiKeysPage() {
  const [kennelId, setKennelId] = useState<string>('')
  const [kennelName, setKennelName] = useState<string>('')
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: kennelArr } = await supabase.from('kennels').select('id, name').eq('owner_id', user.id).limit(1)
      const kennel = kennelArr?.[0]
      if (!kennel) { setLoading(false); return }

      setKennelId(kennel.id)
      setKennelName(kennel.name)
      await fetchKeys(kennel.id)
      setLoading(false)
    }
    load()
  }, [])

  async function fetchKeys(kid: string) {
    const res = await fetch(`/api/keys?kennel_id=${kid}`)
    const data = await res.json()
    setKeys(data.data || [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName.trim() || !kennelId) return
    setCreating(true)
    setError('')
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kennel_id: kennelId, name: newKeyName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error generating key')
      setCreating(false)
      return
    }
    setNewKey(data.key)
    setShowCreate(false)
    setNewKeyName('')
    await fetchKeys(kennelId)
    setCreating(false)
  }

  async function handleRevoke(id: string) {
    if (!confirm('¿Revocar esta API key? Pawdoq dejará de tener acceso si la usaba.')) return
    const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' })
    if (res.ok) await fetchKeys(kennelId)
  }

  function copyKey() {
    if (!newKey) return
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-fg-mute" /></div>
  }

  if (!kennelId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Key className="w-10 h-10 text-fg-mute mx-auto mb-4" />
        <p className="text-fg-dim mb-2">Necesitas tener un criadero para gestionar API keys.</p>
        <Link href="/kennel/new" className="text-sm text-[#D74709] hover:underline">Crear criadero</Link>
      </div>
    )
  }

  const activeKeys = keys.filter(k => !k.revoked_at)
  const revokedKeys = keys.filter(k => k.revoked_at)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/kennel" className="text-fg-mute hover:text-fg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-xs text-fg-mute">{kennelName}</p>
        </div>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-blue-300 mb-1">¿Para qué sirven?</p>
        <p className="text-xs text-fg-dim mb-2">
          Permiten a aplicaciones externas (como <strong>Pawdoq Breeders</strong>) consultar tus perros, camadas y datos del criadero en tiempo real, vía API.
        </p>
        <Link href="/api-docs" className="text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1">
          Ver documentación de la API <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Newly created key (shown once) */}
      {newKey && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-300">
              <strong>Esta es la única vez que verás esta clave.</strong> Cópiala y guárdala en un sitio seguro (gestor de contraseñas, variable de entorno de Pawdoq, etc.).
            </p>
          </div>
          <div className="flex items-center gap-2 bg-ink-900 border border-emerald-500/20 rounded-lg p-3">
            <code className="text-xs text-emerald-300 font-mono flex-1 break-all">{newKey}</code>
            <button onClick={copyKey} className="text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1 flex-shrink-0">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-xs text-fg-dim hover:text-fg/80 mt-3">
            Cerrar
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate ? (
        <form onSubmit={handleCreate} className="bg-chip border border-hair rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">Nueva API key</h3>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-xs text-red-400 mb-3">{error}</div>}
          <input
            type="text"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Ej: Pawdoq producción"
            required autoFocus
            className="w-full bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition mb-3"
          />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={creating || !newKeyName.trim()}
              className="bg-paper-50 text-ink-900 hover:opacity-90 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2">
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Generar
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setNewKeyName(''); setError('') }}
              className="text-sm text-fg-mute hover:text-fg px-3 py-2">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowCreate(true)}
          className="bg-paper-50 text-ink-900 hover:opacity-90 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 mb-6">
          <Plus className="w-4 h-4" /> Nueva API key
        </button>
      )}

      {/* Active keys */}
      <div className="space-y-2 mb-6">
        <h3 className="text-xs font-semibold text-fg-dim uppercase tracking-wider">Activas ({activeKeys.length})</h3>
        {activeKeys.length === 0 ? (
          <p className="text-xs text-fg-mute py-4 text-center bg-ink-800 rounded-lg">Sin keys activas</p>
        ) : (
          activeKeys.map(k => (
            <div key={k.id} className="bg-chip border border-hair rounded-lg p-3 flex items-center gap-3">
              <Key className="w-4 h-4 text-[#D74709] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{k.name}</p>
                <p className="text-[10px] text-fg-mute">
                  gnl_…{k.key_last4} · creada {new Date(k.created_at).toLocaleDateString('es-ES')}
                  {k.last_used_at ? ` · usada ${new Date(k.last_used_at).toLocaleDateString('es-ES')}` : ' · nunca usada'}
                </p>
              </div>
              <button onClick={() => handleRevoke(k.id)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded transition flex-shrink-0">
                <Trash2 className="w-3 h-3" /> Revocar
              </button>
            </div>
          ))
        )}
      </div>

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-fg-dim uppercase tracking-wider">Revocadas ({revokedKeys.length})</h3>
          {revokedKeys.map(k => (
            <div key={k.id} className="bg-ink-800 border border-hair rounded-lg p-3 flex items-center gap-3 opacity-50">
              <Key className="w-4 h-4 text-fg-mute flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate line-through">{k.name}</p>
                <p className="text-[10px] text-fg-mute">
                  gnl_…{k.key_last4} · revocada {k.revoked_at ? new Date(k.revoked_at).toLocaleDateString('es-ES') : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
