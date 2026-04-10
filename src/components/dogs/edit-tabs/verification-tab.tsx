'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Upload, Check, X, Clock, Loader2, FileText, CreditCard, Send } from 'lucide-react'

interface Props { dogId: string; userId: string }

interface Verification {
  id: string; dog_id: string; status: string
  microchip_url: string | null; pedigree_url: string | null
  admin_notes: string | null; submitted_at: string | null; reviewed_at: string | null
}

export default function VerificationTab({ dogId, userId }: Props) {
  const [verification, setVerification] = useState<Verification | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [dogId])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('verifications').select('*').eq('dog_id', dogId).order('created_at', { ascending: false }).limit(1)
    setVerification(data?.[0] || null)
    setLoading(false)
  }

  async function handleUpload(field: 'microchip' | 'pedigree', file: File) {
    setUploading(field)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `verifications/${dogId}/${field}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (uploadErr) { alert('Error al subir: ' + uploadErr.message); setUploading(null); return }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
    const urlField = field === 'microchip' ? 'microchip_url' : 'pedigree_url'

    if (verification) {
      await supabase.from('verifications').update({ [urlField]: urlData.publicUrl }).eq('id', verification.id)
    } else {
      await supabase.from('verifications').insert({ dog_id: dogId, [urlField]: urlData.publicUrl, status: 'draft', submitted_by: userId })
    }
    await load()
    setUploading(null)
  }

  async function handleSubmit() {
    if (!verification) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('verifications').update({ status: 'pending', admin_notes: null, reviewed_at: null, submitted_at: new Date().toISOString() }).eq('id', verification.id)
    await load()
    setSubmitting(false)
  }

  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>

  const v = verification
  const isVerified = v?.status === 'approved'
  const isRejected = v?.status === 'rejected'
  const isPending = v?.status === 'pending'
  const isDraft = !v || v.status === 'draft' || isRejected
  const hasBothDocs = !!v?.microchip_url && !!v?.pedigree_url
  const canSubmit = isDraft && hasBothDocs
  const canUpload = !isVerified && !isPending

  return (
    <div className="space-y-4">
      {isVerified && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-400" />
          <div>
            <p className="text-sm font-semibold text-green-400">Perro verificado</p>
            <p className="text-xs text-white/40">Verificado por el equipo de Genealogic</p>
          </div>
        </div>
      )}

      {isRejected && v?.admin_notes && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-400 mb-1">Solicitud rechazada</p>
          <p className="text-xs text-red-300">{v.admin_notes}</p>
          <p className="text-[10px] text-white/30 mt-2">Sube los documentos corregidos y vuelve a enviar la solicitud</p>
        </div>
      )}

      {isPending && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">Solicitud en revision</p>
            <p className="text-xs text-white/40">El equipo de Genealogic esta revisando tus documentos</p>
          </div>
        </div>
      )}

      {/* Microchip */}
      <DocCard
        icon={CreditCard} label="Documento del microchip" description="Foto del certificado de microchip"
        url={v?.microchip_url} canUpload={canUpload} uploading={uploading === 'microchip'}
        onUpload={file => handleUpload('microchip', file)}
      />

      {/* Pedigree */}
      <DocCard
        icon={FileText} label="Pedigri oficial" description="Documento de pedigri (FCI, UKC, etc.)"
        url={v?.pedigree_url} canUpload={canUpload} uploading={uploading === 'pedigree'}
        onUpload={file => handleUpload('pedigree', file)}
      />

      {/* Submit button */}
      {canSubmit && (
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#D74709] text-white hover:bg-[#c03d07] transition disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? 'Enviando...' : 'Enviar solicitud de verificacion'}
        </button>
      )}

      {isDraft && !hasBothDocs && (
        <p className="text-xs text-white/20 text-center">Sube ambos documentos para poder enviar la solicitud</p>
      )}
    </div>
  )
}

function DocCard({ icon: Icon, label, description, url, canUpload, uploading, onUpload }: {
  icon: any; label: string; description: string; url: string | null
  canUpload: boolean; uploading: boolean; onUpload: (file: File) => void
}) {
  return (
    <div className={`border rounded-xl p-4 ${url ? 'border-green-500/20 bg-green-500/5' : 'border-white/10'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${url ? 'bg-green-500/10' : 'bg-white/5'}`}>
          <Icon className={`w-5 h-5 ${url ? 'text-green-400' : 'text-white/30'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-white/40">{description}</p>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#D74709] hover:underline flex items-center gap-1 mt-1"><FileText className="w-3 h-3" /> Ver documento</a>}
        </div>
        {canUpload && (
          <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition flex-shrink-0 ${uploading ? 'bg-white/5 text-white/30' : 'bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20'}`}>
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {url ? 'Cambiar' : 'Subir'}
            <input type="file" accept="image/*,.pdf" onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]) }} className="hidden" disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  )
}
