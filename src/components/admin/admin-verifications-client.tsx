'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Check, X, Clock, Loader2, FileText, CreditCard, Eye, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface Props { userId: string }

interface VerificationRow {
  id: string; dog_id: string; step: string; status: string
  file_url: string | null; notes: string | null; admin_notes: string | null
  submitted_by: string | null; submitted_at: string | null; reviewed_at: string | null
  dog_name?: string; dog_photo?: string; owner_name?: string
}

const STEP_LABELS: Record<string, string> = { microchip: 'Microchip', pedigree: 'Pedigrí oficial', review: 'Revisión final' }
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  approved: { label: 'Aprobado', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  rejected: { label: 'Rechazado', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

export default function AdminVerificationsClient({ userId }: Props) {
  const [verifications, setVerifications] = useState<VerificationRow[]>([])
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

    if (!data?.length) { setVerifications([]); setLoading(false); return }

    // Get dog names and photos
    const dogIds = [...new Set(data.map(v => v.dog_id))]
    const { data: dogs } = await supabase.from('dogs').select('id, name, thumbnail_url, owner_id').in('id', dogIds)
    const dogMap = new Map((dogs || []).map(d => [d.id, d]))

    // Get owner names
    const ownerIds = [...new Set((dogs || []).map(d => d.owner_id).filter(Boolean))]
    const { data: profiles } = ownerIds.length > 0 ? await supabase.from('profiles').select('id, display_name').in('id', ownerIds) : { data: [] }
    const ownerMap = new Map((profiles || []).map(p => [p.id, p.display_name]))

    setVerifications(data.map(v => {
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

    const v = verifications.find(vr => vr.id === id)
    if (v && action === 'approved') {
      // Check if all document steps for this dog are now approved
      const { data: allSteps } = await supabase.from('verifications').select('step, status').eq('dog_id', v.dog_id)
      const microOk = allSteps?.find(s => s.step === 'microchip')?.status === 'approved'
      const pedigreeOk = allSteps?.find(s => s.step === 'pedigree')?.status === 'approved'
      const reviewExists = allSteps?.find(s => s.step === 'review')

      if (microOk && pedigreeOk && !reviewExists) {
        // Auto-create review step as pending so admin can approve it
        await supabase.from('verifications').insert({
          dog_id: v.dog_id, step: 'review', status: 'pending', submitted_by: v.submitted_by,
        })
      }

      // If approving review step, mark dog as verified
      if (v.step === 'review') {
        await supabase.from('dogs').update({ is_verified: true }).eq('id', v.dog_id)
      }
    }

    // If rejecting review, unverify
    if (v && v.step === 'review' && action === 'rejected') {
      await supabase.from('dogs').update({ is_verified: false }).eq('id', v.dog_id)
    }

    await load()
    setProcessing(null)
  }

  const pendingCount = verifications.filter(v => v.status === 'pending').length

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Verificaciones</h1>
          <p className="text-xs text-white/40">Revisar documentos de verificacion de perros</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['pending', 'approved', 'rejected', ''].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/40 hover:text-white/60'}`}>
            {s === '' ? 'Todos' : STATUS_LABELS[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-16">
          <Check className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
          <p className="text-sm text-white/30">No hay verificaciones {statusFilter === 'pending' ? 'pendientes' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map(v => {
            const statusConf = STATUS_LABELS[v.status]
            const isProcessing = processing === v.id
            return (
              <div key={v.id} className={`border rounded-xl p-4 transition ${statusConf?.color.includes('border') ? '' : 'border-white/10'}`}>
                <div className="flex items-start gap-3">
                  {/* Dog photo */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                    {v.dog_photo ? <img src={v.dog_photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/10"><Shield className="w-5 h-5" /></div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/dogs/${v.dog_id}`} className="text-sm font-semibold hover:text-[#D74709] transition">{v.dog_name}</Link>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusConf?.color || ''}`}>{statusConf?.label}</span>
                      <span className="text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded">{STEP_LABELS[v.step] || v.step}</span>
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">
                      {v.owner_name && <span>{v.owner_name} · </span>}
                      {v.submitted_at && new Date(v.submitted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {v.file_url && (
                      <a href={v.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[#D74709] hover:underline">
                        <FileText className="w-3 h-3" /> Ver documento
                      </a>
                    )}

                    {v.admin_notes && v.status !== 'pending' && (
                      <p className="text-xs text-white/40 mt-1 italic">Nota: {v.admin_notes}</p>
                    )}

                    {v.status === 'pending' && (
                      <div className="mt-3 flex items-end gap-2">
                        <div className="flex-1">
                          <input value={adminNotes[v.id] || ''} onChange={e => setAdminNotes(prev => ({ ...prev, [v.id]: e.target.value }))}
                            placeholder="Notas (opcional)..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:border-[#D74709] focus:outline-none" />
                        </div>
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
