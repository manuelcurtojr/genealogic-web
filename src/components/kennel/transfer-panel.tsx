'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ArrowRightLeft, Dog, Check, AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  dog: { id: string; name: string; thumbnail_url: string | null; breed_name?: string } | null
  kennelName?: string
}

export default function TransferPanel({ open, onClose, dog, kennelName }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<{ id: string; display_name: string; email: string } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) { setEmail(''); setFoundUser(null); setNotFound(false); setDone(false); setError('') }
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  async function handleSearch() {
    if (!email.trim()) return
    setSearching(true)
    setFoundUser(null)
    setNotFound(false)
    setError('')

    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('email', email.trim().toLowerCase())
      .limit(1)

    if (data && data.length > 0) {
      setFoundUser(data[0])
    } else {
      setNotFound(true)
    }
    setSearching(false)
  }

  async function handleTransfer() {
    if (!dog || !foundUser) return
    setTransferring(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado'); setTransferring(false); return }

    // Update owner_id, preserve breeder_id
    const { error: err } = await supabase.from('dogs').update({
      owner_id: foundUser.id,
      breeder_id: user.id, // ensure breeder stays as current user
    }).eq('id', dog.id)

    if (err) { setError(err.message); setTransferring(false); return }

    // Notify new owner
    const notifTitle = 'Has recibido un perro'
    const notifMessage = `${kennelName || 'Un criador'} te ha transferido el perro "${dog.name}"`
    await supabase.from('notifications').insert({
      user_id: foundUser.id,
      type: 'info',
      title: notifTitle,
      message: notifMessage,
      link: `/dogs/${dog.id}`,
    })

    // Send push notification
    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: foundUser.id,
        title: notifTitle,
        body: notifMessage,
        data: { link: `/dogs/${dog.id}` },
      }),
    }).catch(() => {})

    setTransferring(false)
    setDone(true)
    setTimeout(() => {
      onClose()
      router.refresh()
    }, 1500)
  }

  if (!dog) return null

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-md z-[70] bg-ink-800 border-l border-hair shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-hair flex-shrink-0">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#D74709]" />
            <h2 className="text-base sm:text-lg font-semibold">Transferir perro</h2>
          </div>
          <button onClick={onClose} className="text-fg-mute hover:text-fg transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Dog info */}
          <div className="flex items-center gap-3 bg-chip border border-hair rounded-xl p-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-chip flex-shrink-0">
              {dog.thumbnail_url ? (
                <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Dog className="w-6 h-6 text-fg-mute" /></div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{dog.name}</p>
              {dog.breed_name && <p className="text-xs text-fg-mute">{dog.breed_name}</p>}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-400">Al transferir, el nuevo propietario podra gestionar este perro. El perro seguira apareciendo en tu criadero.</p>
          </div>

          {/* Email search */}
          <div>
            <label className="text-[11px] font-semibold text-fg-dim uppercase tracking-wider mb-1 block">Email del nuevo propietario</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setFoundUser(null); setNotFound(false) }}
                placeholder="cliente@email.com"
                className="flex-1 bg-chip border border-hair rounded-lg px-3 py-2 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !email.trim()}
                className="px-4 py-2 bg-chip border border-hair rounded-lg text-sm text-fg-dim hover:bg-chip transition disabled:opacity-30 flex items-center gap-1.5"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar
              </button>
            </div>
          </div>

          {/* Found user */}
          {foundUser && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">
                {(foundUser.display_name || foundUser.email)[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-400">{foundUser.display_name || 'Usuario'}</p>
                <p className="text-xs text-fg-mute">{foundUser.email}</p>
              </div>
              <Check className="w-5 h-5 text-green-400" />
            </div>
          )}

          {/* Not found */}
          {notFound && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              <p className="text-sm text-red-400">No se encontro ningun usuario con ese email</p>
              <p className="text-xs text-fg-mute mt-1">El usuario debe estar registrado en Genealogic</p>
            </div>
          )}

          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          {done && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-400">Perro transferido correctamente</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-hair flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-fg-dim hover:text-fg hover:bg-chip transition">Cancelar</button>
          <button
            onClick={handleTransfer}
            disabled={!foundUser || transferring || done}
            className="bg-paper-50 text-ink-900 hover:opacity-90 font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            {transferring ? 'Transfiriendo...' : 'Transferir perro'}
          </button>
        </div>
      </div>
    </>
  )
}
