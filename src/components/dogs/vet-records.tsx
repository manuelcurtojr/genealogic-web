'use client'

import { useState, useEffect } from 'react'
import { Plus, Syringe, Bug, Pill, FlaskConical, Scissors, Eye, EyeOff, Pencil, Trash2, AlertTriangle, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/modal'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface VetRecord {
  id: string
  record_type: string
  name: string
  date: string
  vet_name: string | null
  notes: string | null
  file_url: string | null
  is_public: boolean
  next_reminder: string | null
}

interface VetRecordsProps {
  dogId: string
  ownerId: string
  isOwner: boolean
}

const RECORD_TYPES = [
  { key: 'vaccine', label: 'Vacuna', icon: Syringe, color: '#3498db', bg: 'bg-blue-500/15 text-blue-400', reminderDays: 365 },
  { key: 'deworming', label: 'Desparasitacion', icon: Bug, color: '#27ae60', bg: 'bg-green-500/15 text-green-400', reminderDays: 90 },
  { key: 'treatment', label: 'Tratamiento', icon: Pill, color: '#f39c12', bg: 'bg-orange-500/15 text-orange-400', reminderDays: null },
  { key: 'test', label: 'Test', icon: FlaskConical, color: '#9b59b6', bg: 'bg-purple-500/15 text-purple-400', reminderDays: null },
  { key: 'surgery', label: 'Cirugia', icon: Scissors, color: '#e74c3c', bg: 'bg-red-500/15 text-red-400', reminderDays: null },
] as const

function getRecordType(key: string) {
  return RECORD_TYPES.find(t => t.key === key) || RECORD_TYPES[0]
}

function isOverdue(reminder: string | null) {
  if (!reminder) return false
  return new Date(reminder) < new Date()
}

export default function VetRecords({ dogId, ownerId, isOwner }: VetRecordsProps) {
  const [records, setRecords] = useState<VetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<VetRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const supabase = createClient()

  async function fetchRecords() {
    setLoading(true)
    const { data } = await supabase
      .from('vet_records')
      .select('*')
      .eq('dog_id', dogId)
      .order('date', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [dogId])

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('vet_records').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchRecords()
  }

  async function togglePublic(record: VetRecord) {
    await supabase.from('vet_records').update({ is_public: !record.is_public }).eq('id', record.id)
    fetchRecords()
  }

  if (loading) {
    return <div className="text-white/30 text-sm py-8 text-center">Cargando registros veterinarios...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Cartilla Veterinaria</h3>
        {isOwner && (
          <button
            onClick={() => { setEditRecord(null); setFormOpen(true) }}
            className="flex items-center gap-1.5 bg-[#D74709] hover:bg-[#c03d07] text-white text-sm px-3 py-1.5 rounded-lg transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        )}
      </div>

      {/* Reminders */}
      {records.filter(r => isOverdue(r.next_reminder)).length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-orange-400 font-medium">Recordatorios pendientes</p>
            {records.filter(r => isOverdue(r.next_reminder)).map(r => (
              <p key={r.id} className="text-xs text-orange-300/70 mt-0.5">
                {getRecordType(r.record_type).label}: {r.name} — vencido {new Date(r.next_reminder!).toLocaleDateString('es-ES')}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Records list */}
      {records.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <Syringe className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay registros veterinarios</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(record => {
            const type = getRecordType(record.record_type)
            const Icon = type.icon
            const overdue = isOverdue(record.next_reminder)
            return (
              <div key={record.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3 group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${type.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{record.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${type.bg}`}>{type.label}</span>
                    {overdue && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400">Vencido</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {new Date(record.date).toLocaleDateString('es-ES')}
                    {record.vet_name && <> &middot; {record.vet_name}</>}
                  </p>
                  {record.notes && <p className="text-xs text-white/50 mt-1">{record.notes}</p>}
                  {record.file_url && (
                    <a href={record.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#D74709] hover:underline mt-1 inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Ver archivo
                    </a>
                  )}
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => togglePublic(record)} className="p-1.5 text-white/30 hover:text-white/60 transition" title={record.is_public ? 'Hacer privado' : 'Hacer publico'}>
                      {record.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => { setEditRecord(record); setFormOpen(true) }} className="p-1.5 text-white/30 hover:text-white/60 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(record.id)} className="p-1.5 text-white/30 hover:text-red-400 transition">
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
      <VetRecordForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRecord(null) }}
        onSaved={fetchRecords}
        dogId={dogId}
        ownerId={ownerId}
        editRecord={editRecord}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar registro"
        message="Este registro veterinario se eliminara permanentemente."
      />
    </div>
  )
}

/* ---- Form Component ---- */

function VetRecordForm({ open, onClose, onSaved, dogId, ownerId, editRecord }: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  dogId: string
  ownerId: string
  editRecord: VetRecord | null
}) {
  const isEdit = !!editRecord
  const [form, setForm] = useState({
    record_type: 'vaccine',
    name: '',
    date: new Date().toISOString().split('T')[0],
    vet_name: '',
    notes: '',
    is_public: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editRecord) {
      setForm({
        record_type: editRecord.record_type,
        name: editRecord.name,
        date: editRecord.date,
        vet_name: editRecord.vet_name || '',
        notes: editRecord.notes || '',
        is_public: editRecord.is_public,
      })
    } else {
      setForm({ record_type: 'vaccine', name: '', date: new Date().toISOString().split('T')[0], vet_name: '', notes: '', is_public: false })
    }
    setError('')
  }, [editRecord, open])

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }

    setSaving(true)
    setError('')

    const supabase = createClient()
    const type = RECORD_TYPES.find(t => t.key === form.record_type)
    const nextReminder = type?.reminderDays
      ? new Date(new Date(form.date).getTime() + type.reminderDays * 86400000).toISOString().split('T')[0]
      : null

    const payload = {
      dog_id: dogId,
      owner_id: ownerId,
      record_type: form.record_type,
      name: form.name.trim(),
      date: form.date,
      vet_name: form.vet_name.trim() || null,
      notes: form.notes.trim() || null,
      is_public: form.is_public,
      next_reminder: nextReminder,
    }

    const { error: err } = isEdit
      ? await supabase.from('vet_records').update(payload).eq('id', editRecord!.id)
      : await supabase.from('vet_records').insert(payload)

    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Registro' : 'Nuevo Registro Veterinario'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

        {/* Type selector */}
        <div>
          <label className="block text-xs text-white/40 mb-2">Tipo</label>
          <div className="grid grid-cols-5 gap-1.5">
            {RECORD_TYPES.map(({ key, label, icon: Icon, bg }) => (
              <button
                key={key}
                type="button"
                onClick={() => set('record_type', key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition border ${
                  form.record_type === key ? `${bg} border-white/20` : 'border-transparent text-white/30 hover:text-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate w-full text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs text-white/40 mb-1">Nombre *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D74709]"
            placeholder="Ej: Rabia, Parvovirus, Milbemax..."
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

        {/* Vet name */}
        <div>
          <label className="block text-xs text-white/40 mb-1">Veterinario</label>
          <input
            value={form.vet_name}
            onChange={e => set('vet_name', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D74709]"
            placeholder="Nombre del veterinario"
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
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={e => set('is_public', e.target.checked)}
            className="sr-only"
          />
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
          <button
            type="submit"
            disabled={saving}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar registro'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
