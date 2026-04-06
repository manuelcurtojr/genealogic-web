'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Modal from '@/components/ui/modal'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import SearchableSelect from '@/components/ui/searchable-select'

interface DealFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initialData?: any
  stages: { id: string; name: string }[]
  contacts: { id: string; name: string }[]
  pipelineId: string
  userId: string
}

export default function DealForm({ open, onClose, onSaved, initialData, stages, contacts, pipelineId, userId }: DealFormProps) {
  const isEdit = !!initialData
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState(() => ({
    title: initialData?.title || '',
    value: initialData?.value?.toString() || '',
    currency: initialData?.currency || 'EUR',
    contact_id: initialData?.contact_id || '',
    stage_id: initialData?.stage_id || stages[0]?.id || '',
    lost_reason: initialData?.lost_reason || '',
  }))

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      title: form.title.trim(),
      value: form.value ? parseFloat(form.value) : null,
      currency: form.currency,
      contact_id: form.contact_id || null,
      stage_id: form.stage_id || null,
      pipeline_id: pipelineId,
      lost_reason: form.lost_reason || null,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('deals').update(payload).eq('id', initialData.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('deals').insert({ ...payload, owner_id: userId })
      if (err) { setError(err.message); setLoading(false); return }
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('deals').delete().eq('id', initialData.id)
    setDeleting(false)
    setShowDelete(false)
    onSaved()
    onClose()
  }

  const stageOptions = stages.map(s => ({ value: s.id, label: s.name }))
  const contactOptions = contacts.map(c => ({ value: c.id, label: c.name }))

  return (
    <>
      <Modal open={open} onClose={onClose} title={isEdit ? 'Editar negocio' : 'Nuevo negocio'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Titulo *</label>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required autoFocus
              placeholder="Ej: Venta cachorro a Juan"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Valor</label>
              <input type="number" step="0.01" value={form.value} onChange={(e) => set('value', e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Moneda</label>
              <select value={form.currency} onChange={(e) => set('currency', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none">
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <SearchableSelect label="Contacto" options={contactOptions} value={form.contact_id} onChange={(v) => set('contact_id', v)} placeholder="Seleccionar contacto" />
          <SearchableSelect label="Etapa" options={stageOptions} value={form.stage_id} onChange={(v) => set('stage_id', v)} placeholder="Seleccionar etapa" />

          {form.lost_reason !== undefined && isEdit && (
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Razon de perdida</label>
              <input type="text" value={form.lost_reason} onChange={(e) => set('lost_reason', e.target.value)}
                placeholder="Opcional"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              <button type="button" onClick={() => setShowDelete(true)} className="text-sm text-red-400 hover:text-red-300 transition">
                Eliminar
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/15 text-white transition">
                Cancelar
              </button>
              <button type="submit" disabled={loading || !form.title.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#D74709] hover:bg-[#c03d07] text-white transition disabled:opacity-50 flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        title="Eliminar negocio"
        message="¿Estas seguro de que quieres eliminar este negocio?"
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
      />
    </>
  )
}
