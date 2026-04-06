'use client'

import { useState, useEffect } from 'react'
import { Plus, Trophy, Medal, Star, Crown, Award, Eye, EyeOff, Pencil, Trash2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/modal'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface AwardRecord {
  id: string
  award_type: string
  event_name: string
  date: string
  judge: string | null
  notes: string | null
  file_url: string | null
  is_public: boolean
}

interface AwardsProps {
  dogId: string
  ownerId: string
  isOwner: boolean
}

const AWARD_TYPES = [
  { key: 'CAC', label: 'CAC', description: 'Certificat d\'Aptitude', color: 'bg-blue-500/15 text-blue-400' },
  { key: 'CACIB', label: 'CACIB', description: 'International', color: 'bg-indigo-500/15 text-indigo-400' },
  { key: 'BOB', label: 'BOB', description: 'Best of Breed', color: 'bg-amber-500/15 text-amber-400' },
  { key: 'BOS', label: 'BOS', description: 'Best of Sex', color: 'bg-pink-500/15 text-pink-400' },
  { key: 'BOG', label: 'BOG', description: 'Best of Group', color: 'bg-purple-500/15 text-purple-400' },
  { key: 'BIS', label: 'BIS', description: 'Best in Show', color: 'bg-yellow-500/15 text-yellow-400' },
  { key: 'other', label: 'Otro', description: 'Otro premio', color: 'bg-white/10 text-white/60' },
] as const

function getAwardType(key: string) {
  return AWARD_TYPES.find(t => t.key === key) || AWARD_TYPES[6]
}

export default function Awards({ dogId, ownerId, isOwner }: AwardsProps) {
  const [awards, setAwards] = useState<AwardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editAward, setEditAward] = useState<AwardRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const supabase = createClient()

  async function fetchAwards() {
    setLoading(true)
    const { data } = await supabase
      .from('awards')
      .select('*')
      .eq('dog_id', dogId)
      .order('date', { ascending: false })
    setAwards(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAwards() }, [dogId])

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('awards').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchAwards()
  }

  async function togglePublic(award: AwardRecord) {
    await supabase.from('awards').update({ is_public: !award.is_public }).eq('id', award.id)
    fetchAwards()
  }

  if (loading) {
    return <div className="text-white/30 text-sm py-8 text-center">Cargando palmares...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Palmares</h3>
        {isOwner && (
          <button
            onClick={() => { setEditAward(null); setFormOpen(true) }}
            className="flex items-center gap-1.5 bg-[#D74709] hover:bg-[#c03d07] text-white text-sm px-3 py-1.5 rounded-lg transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        )}
      </div>

      {awards.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay premios registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {awards.map(award => {
            const type = getAwardType(award.award_type)
            return (
              <div key={award.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3 group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${type.color}`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{award.event_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${type.color}`}>{type.label}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {new Date(award.date).toLocaleDateString('es-ES')}
                    {award.judge && <> &middot; Juez: {award.judge}</>}
                  </p>
                  {award.notes && <p className="text-xs text-white/50 mt-1">{award.notes}</p>}
                  {award.file_url && (
                    <a href={award.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#D74709] hover:underline mt-1 inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Ver certificado
                    </a>
                  )}
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => togglePublic(award)} className="p-1.5 text-white/30 hover:text-white/60 transition" title={award.is_public ? 'Hacer privado' : 'Hacer publico'}>
                      {award.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => { setEditAward(award); setFormOpen(true) }} className="p-1.5 text-white/30 hover:text-white/60 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(award.id)} className="p-1.5 text-white/30 hover:text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      <AwardForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditAward(null) }}
        onSaved={fetchAwards}
        dogId={dogId}
        ownerId={ownerId}
        editAward={editAward}
      />

      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar premio"
        message="Este premio se eliminara permanentemente."
      />
    </div>
  )
}

function AwardForm({ open, onClose, onSaved, dogId, ownerId, editAward }: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  dogId: string
  ownerId: string
  editAward: AwardRecord | null
}) {
  const isEdit = !!editAward
  const [form, setForm] = useState({
    award_type: 'CAC',
    event_name: '',
    date: new Date().toISOString().split('T')[0],
    judge: '',
    notes: '',
    is_public: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editAward) {
      setForm({
        award_type: editAward.award_type,
        event_name: editAward.event_name,
        date: editAward.date,
        judge: editAward.judge || '',
        notes: editAward.notes || '',
        is_public: editAward.is_public,
      })
    } else {
      setForm({ award_type: 'CAC', event_name: '', date: new Date().toISOString().split('T')[0], judge: '', notes: '', is_public: false })
    }
    setError('')
  }, [editAward, open])

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.event_name.trim()) { setError('El nombre del evento es obligatorio'); return }

    setSaving(true)
    setError('')

    const supabase = createClient()
    const payload = {
      dog_id: dogId,
      owner_id: ownerId,
      award_type: form.award_type,
      event_name: form.event_name.trim(),
      date: form.date,
      judge: form.judge.trim() || null,
      notes: form.notes.trim() || null,
      is_public: form.is_public,
    }

    const { error: err } = isEdit
      ? await supabase.from('awards').update(payload).eq('id', editAward!.id)
      : await supabase.from('awards').insert(payload)

    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Premio' : 'Nuevo Premio'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

        {/* Type */}
        <div>
          <label className="block text-xs text-white/40 mb-2">Tipo de premio</label>
          <div className="grid grid-cols-4 gap-1.5">
            {AWARD_TYPES.map(({ key, label, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => set('award_type', key)}
                className={`p-2 rounded-lg text-xs font-bold transition border ${
                  form.award_type === key ? `${color} border-white/20` : 'border-transparent text-white/30 hover:text-white/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Event name */}
        <div>
          <label className="block text-xs text-white/40 mb-1">Evento *</label>
          <input
            value={form.event_name}
            onChange={e => set('event_name', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D74709]"
            placeholder="Ej: Exposicion Nacional Madrid 2024"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs text-white/40 mb-1">Fecha *</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D74709]"
          />
        </div>

        {/* Judge */}
        <div>
          <label className="block text-xs text-white/40 mb-1">Juez</label>
          <input
            value={form.judge}
            onChange={e => set('judge', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D74709]"
            placeholder="Nombre del juez"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-white/40 mb-1">Notas</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D74709] resize-none"
          />
        </div>

        {/* Public toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_public} onChange={e => set('is_public', e.target.checked)} className="sr-only" />
          <div className={`w-8 h-4.5 rounded-full transition ${form.is_public ? 'bg-[#D74709]' : 'bg-white/20'} relative`}>
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition ${form.is_public ? 'left-4' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-white/60">Visible publicamente</span>
        </label>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white transition">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar premio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
