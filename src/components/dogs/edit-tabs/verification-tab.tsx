'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Upload, Check, X, Clock, Loader2, FileText, CreditCard } from 'lucide-react'

interface Props { dogId: string; userId: string }

interface Verification {
  id: string; step: string; status: string; file_url: string | null
  notes: string | null; admin_notes: string | null
  submitted_at: string | null; reviewed_at: string | null
}

const STEPS = [
  { key: 'microchip', label: 'Microchip', description: 'Sube una foto del documento del microchip del perro', icon: CreditCard },
  { key: 'pedigree', label: 'Pedigrí oficial', description: 'Sube el documento de pedigrí oficial (FCI, UKC, etc.)', icon: FileText },
  { key: 'review', label: 'Revisión final', description: 'El equipo de Genealogic revisará toda la documentación', icon: Shield },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-400 bg-yellow-500/10', icon: Clock },
  approved: { label: 'Aprobado', color: 'text-green-400 bg-green-500/10', icon: Check },
  rejected: { label: 'Rechazado', color: 'text-red-400 bg-red-500/10', icon: X },
}

export default function VerificationTab({ dogId, userId }: Props) {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => { load() }, [dogId])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('verifications').select('*').eq('dog_id', dogId).order('created_at')
    setVerifications(data || [])
    setLoading(false)
  }

  async function handleUpload(step: string, file: File) {
    setUploading(step)
    const supabase = createClient()

    // Upload file to storage
    const ext = file.name.split('.').pop()
    const path = `verifications/${dogId}/${step}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (uploadErr) { alert('Error al subir: ' + uploadErr.message); setUploading(null); return }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)

    // Check if verification for this step already exists
    const existing = verifications.find(v => v.step === step)
    if (existing) {
      await supabase.from('verifications').update({
        file_url: urlData.publicUrl, status: 'pending', admin_notes: null, reviewed_at: null, submitted_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabase.from('verifications').insert({
        dog_id: dogId, step, status: 'pending', file_url: urlData.publicUrl, submitted_by: userId,
      })
    }

    await load()
    setUploading(null)
  }

  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>

  const allApproved = STEPS.filter(s => s.key !== 'review').every(s => verifications.find(v => v.step === s.key)?.status === 'approved')
  const isFullyVerified = verifications.find(v => v.step === 'review')?.status === 'approved'

  return (
    <div className="space-y-4">
      {isFullyVerified && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-400" />
          <div>
            <p className="text-sm font-semibold text-green-400">Perro verificado</p>
            <p className="text-xs text-white/40">Este perro ha sido verificado por el equipo de Genealogic</p>
          </div>
        </div>
      )}

      {STEPS.map(step => {
        const v = verifications.find(vr => vr.step === step.key)
        const status = v?.status || 'none'
        const statusConf = STATUS_CONFIG[status]
        const Icon = step.icon
        const isReview = step.key === 'review'
        const canSubmit = !isReview && status !== 'approved'
        const isUploading = uploading === step.key

        return (
          <div key={step.key} className={`border rounded-xl p-4 transition ${status === 'approved' ? 'border-green-500/20 bg-green-500/5' : status === 'rejected' ? 'border-red-500/20 bg-red-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status === 'approved' ? 'bg-green-500/10' : status === 'rejected' ? 'bg-red-500/10' : 'bg-white/5'}`}>
                <Icon className={`w-5 h-5 ${status === 'approved' ? 'text-green-400' : status === 'rejected' ? 'text-red-400' : 'text-white/30'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{step.label}</p>
                  {statusConf && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusConf.color}`}>{statusConf.label}</span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5">{step.description}</p>

                {v?.admin_notes && (
                  <div className={`mt-2 text-xs p-2 rounded ${status === 'rejected' ? 'bg-red-500/10 text-red-300' : 'bg-white/5 text-white/50'}`}>
                    Nota del admin: {v.admin_notes}
                  </div>
                )}

                {v?.file_url && (
                  <a href={v.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[#D74709] hover:underline">
                    <FileText className="w-3 h-3" /> Ver documento
                  </a>
                )}
              </div>

              {canSubmit && (
                <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition flex-shrink-0 ${isUploading ? 'bg-white/5 text-white/30' : 'bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20'}`}>
                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {isUploading ? 'Subiendo...' : v ? 'Resubir' : 'Subir'}
                  <input type="file" accept="image/*,.pdf" onChange={e => { if (e.target.files?.[0]) handleUpload(step.key, e.target.files[0]) }} className="hidden" disabled={isUploading} />
                </label>
              )}

              {isReview && !allApproved && (
                <span className="text-[10px] text-white/20 flex-shrink-0">Primero sube los documentos</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
