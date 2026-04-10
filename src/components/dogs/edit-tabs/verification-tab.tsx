'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Upload, Check, X, Clock, Loader2, FileText, CreditCard } from 'lucide-react'

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
    const fileUrl = urlData.publicUrl
    const urlField = field === 'microchip' ? 'microchip_url' : 'pedigree_url'

    if (verification) {
      await supabase.from('verifications').update({ [urlField]: fileUrl, status: 'pending', admin_notes: null, reviewed_at: null }).eq('id', verification.id)
    } else {
      await supabase.from('verifications').insert({ dog_id: dogId, [urlField]: fileUrl, status: 'pending', submitted_by: userId })
    }
    await load()
    setUploading(null)
  }

  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>

  const v = verification
  const isVerified = v?.status === 'approved'
  const isRejected = v?.status === 'rejected'
  const isPending = v?.status === 'pending'
  const canUpload = !isVerified

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
          <p className="text-[10px] text-white/30 mt-2">Puedes volver a subir los documentos corregidos</p>
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
      <div className={`border rounded-xl p-4 ${v?.microchip_url ? 'border-green-500/20 bg-green-500/5' : 'border-white/10'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${v?.microchip_url ? 'bg-green-500/10' : 'bg-white/5'}`}>
            <CreditCard className={`w-5 h-5 ${v?.microchip_url ? 'text-green-400' : 'text-white/30'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Documento del microchip</p>
            <p className="text-xs text-white/40">Foto del certificado de microchip</p>
            {v?.microchip_url && <a href={v.microchip_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#D74709] hover:underline flex items-center gap-1 mt-1"><FileText className="w-3 h-3" /> Ver documento</a>}
          </div>
          {canUpload && (
            <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition flex-shrink-0 ${uploading === 'microchip' ? 'bg-white/5 text-white/30' : 'bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20'}`}>
              {uploading === 'microchip' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {v?.microchip_url ? 'Cambiar' : 'Subir'}
              <input type="file" accept="image/*,.pdf" onChange={e => { if (e.target.files?.[0]) handleUpload('microchip', e.target.files[0]) }} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Pedigree */}
      <div className={`border rounded-xl p-4 ${v?.pedigree_url ? 'border-green-500/20 bg-green-500/5' : 'border-white/10'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${v?.pedigree_url ? 'bg-green-500/10' : 'bg-white/5'}`}>
            <FileText className={`w-5 h-5 ${v?.pedigree_url ? 'text-green-400' : 'text-white/30'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Pedigri oficial</p>
            <p className="text-xs text-white/40">Documento de pedigri (FCI, UKC, etc.)</p>
            {v?.pedigree_url && <a href={v.pedigree_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#D74709] hover:underline flex items-center gap-1 mt-1"><FileText className="w-3 h-3" /> Ver documento</a>}
          </div>
          {canUpload && (
            <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition flex-shrink-0 ${uploading === 'pedigree' ? 'bg-white/5 text-white/30' : 'bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20'}`}>
              {uploading === 'pedigree' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {v?.pedigree_url ? 'Cambiar' : 'Subir'}
              <input type="file" accept="image/*,.pdf" onChange={e => { if (e.target.files?.[0]) handleUpload('pedigree', e.target.files[0]) }} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {!v && (
        <p className="text-xs text-white/20 text-center">Sube ambos documentos para solicitar la verificacion</p>
      )}
    </div>
  )
}
