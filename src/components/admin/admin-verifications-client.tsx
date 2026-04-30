'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Check, X, Clock, Loader2, FileText, CreditCard, Eye } from 'lucide-react'
import Link from 'next/link'

interface Props { userId: string }

interface VerificationRow {
  id: string; dog_id: string; status: string
  microchip_url: string | null; pedigree_url: string | null
  admin_notes: string | null; submitted_at: string | null; reviewed_at: string | null
  dog_name?: string; dog_photo?: string; owner_name?: string
}

export default function AdminVerificationsClient({ userId }: Props) {
  const [items, setItems] = useState<VerificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [statusFilter])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('verifications').select('*').order('submitted_at', { ascending: false })
    if (statusFilter) query = query.eq('status', statusFilter)
    const { data } = await query.limit(200)

    if (!data?.length) { setItems([]); setLoading(false); return }

    const dogIds = [...new Set(data.map(v => v.dog_id))]
    const { data: dogs } = await supabase.from('dogs').select('id, name, thumbnail_url, owner_id').in('id', dogIds)
    const dogMap = new Map((dogs || []).map(d => [d.id, d]))

    const ownerIds = [...new Set((dogs || []).map(d => d.owner_id).filter(Boolean))]
    const { data: profiles } = ownerIds.length > 0 ? await supabase.from('profiles').select('id, display_name').in('id', ownerIds) : { data: [] }
    const ownerMap = new Map((profiles || []).map(p => [p.id, p.display_name]))

    setItems(data.map(v => {
      const dog = dogMap.get(v.dog_id)
      return { ...v, dog_name: dog?.name || '?', dog_photo: dog?.thumbnail_url, owner_name: ownerMap.get(dog?.owner_id || '') || '' }
    }))
    setLoading(false)
  }

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    setProcessing(id)
    const supabase = createClient()
    const notes = adminNotes[id] || null

    await supabase.from('verifications').update({
      status: action, admin_notes: notes, reviewed_by: userId, reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    // Mark dog as verified/unverified
    const v = items.find(i => i.id === id)
    if (v) {
      await supabase.from('dogs').update({ is_verified: action === 'approved' }).eq('id', v.dog_id)
    }

    await load()
    setProcessing(null)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Verificaciones</h1>
          <p className="text-xs text-fg-mute">Revisar solicitudes de verificacion de perros</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['pending', 'approved', 'rejected', ''].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? 'bg-[#D74709] text-white' : 'bg-chip text-fg-mute hover:text-fg-dim'}`}>
            {s === '' ? 'Todos' : s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobados' : 'Rechazados'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-fg-mute" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Check className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
          <p className="text-sm text-fg-mute">No hay verificaciones {statusFilter === 'pending' ? 'pendientes' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(v => {
            const isProcessing = processing === v.id
            const formatted = v.submitted_at ? new Date(v.submitted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

            return (
              <div key={v.id} className={`border rounded-xl p-4 ${v.status === 'approved' ? 'border-green-500/20 bg-green-500/5' : v.status === 'rejected' ? 'border-red-500/20 bg-red-500/5' : 'border-hair'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-chip flex-shrink-0">
                    {v.dog_photo ? <img src={v.dog_photo} alt="" className="w-full h-full object-cover" /> : <Shield className="w-5 h-5 text-fg-mute m-auto" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/dogs/${v.dog_id}`} className="text-sm font-semibold hover:text-[#D74709] transition">{v.dog_name}</Link>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${v.status === 'approved' ? 'text-green-400 bg-green-500/10' : v.status === 'rejected' ? 'text-red-400 bg-red-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                        {v.status === 'pending' ? 'Pendiente' : v.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                    <p className="text-xs text-fg-mute mt-0.5">{v.owner_name && <span>{v.owner_name} · </span>}{formatted}</p>

                    {/* Documents */}
                    <div className="flex items-center gap-3 mt-2">
                      {v.microchip_url ? (
                        <a href={v.microchip_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#D74709] hover:underline">
                          <CreditCard className="w-3 h-3" /> Microchip
                        </a>
                      ) : <span className="text-[10px] text-fg-mute">Sin microchip</span>}
                      {v.pedigree_url ? (
                        <a href={v.pedigree_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#D74709] hover:underline">
                          <FileText className="w-3 h-3" /> Pedigri
                        </a>
                      ) : <span className="text-[10px] text-fg-mute">Sin pedigri</span>}
                    </div>

                    {v.admin_notes && v.status !== 'pending' && (
                      <p className="text-xs text-fg-mute mt-1 italic">Nota: {v.admin_notes}</p>
                    )}

                    {v.status === 'pending' && (
                      <div className="flex items-end gap-2 mt-3">
                        <input value={adminNotes[v.id] || ''} onChange={e => setAdminNotes(prev => ({ ...prev, [v.id]: e.target.value }))}
                          placeholder="Notas (opcional)..." className="flex-1 bg-chip border border-hair rounded-lg px-3 py-2 text-xs text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
                        <button onClick={() => handleAction(v.id, 'approved')} disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 hover:bg-green-500/20 transition disabled:opacity-50">
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Aprobar
                        </button>
                        <button onClick={() => handleAction(v.id, 'rejected')} disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50">
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
