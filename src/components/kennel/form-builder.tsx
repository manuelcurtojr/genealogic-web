'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Plus, Trash2, GripVertical, Copy, Check, ExternalLink, FileText } from 'lucide-react'

interface FormField {
  id: string
  label: string
  type: 'text' | 'select' | 'file'
  options?: string // comma-separated for selects
  required: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  kennelId: string
  userId: string
}

const TEMPLATES: { name: string; desc: string; fields: Omit<FormField, 'id'>[] }[] = [
  {
    name: 'Estandar',
    desc: 'Sexo y color deseado',
    fields: [
      { label: 'Sexo que buscas', type: 'select', options: 'Indiferente,Macho,Hembra', required: false },
      { label: 'Color que buscas', type: 'text', required: false },
    ],
  },
  {
    name: 'Mascota / Hogar',
    desc: 'Preguntas sobre estilo de vida',
    fields: [
      { label: 'Sexo que buscas', type: 'select', options: 'Indiferente,Macho,Hembra', required: false },
      { label: 'Tienes experiencia con esta raza?', type: 'select', options: 'Si,No,Es mi primera vez', required: false },
      { label: 'Tipo de vivienda', type: 'select', options: 'Piso,Casa con jardin,Finca/rural', required: false },
      { label: 'Hay ninos en casa?', type: 'select', options: 'Si,No', required: false },
    ],
  },
  {
    name: 'Perro de Trabajo',
    desc: 'Preguntas para uso profesional',
    fields: [
      { label: 'Sexo que buscas', type: 'select', options: 'Indiferente,Macho,Hembra', required: false },
      { label: 'Uso previsto', type: 'select', options: 'Guarda,Pastoreo,Caza,Exposicion,Deporte,Otro', required: false },
      { label: 'Experiencia previa con la raza', type: 'text', required: false },
      { label: 'Documentacion o titulos que necesitas', type: 'text', required: false },
    ],
  },
]

function uid() { return Math.random().toString(36).slice(2, 9) }

export default function FormBuilder({ open, onClose, kennelId, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formId, setFormId] = useState<string | null>(null)
  const [formName, setFormName] = useState('Formulario de contacto')
  const [fields, setFields] = useState<FormField[]>([])
  const [isActive, setIsActive] = useState(true)
  const [copied, setCopied] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const supabase = createClient()
    supabase.from('kennel_forms').select('*').eq('kennel_id', kennelId).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        const f = data[0]
        setFormId(f.id)
        setFormName(f.name)
        setFields((f.fields as FormField[]) || [])
        setIsActive(f.is_active)
      } else {
        setFormId(null)
        setFormName('Formulario de contacto')
        setFields([])
        setIsActive(true)
      }
      setLoading(false)
    })
  }, [open, kennelId])

  function applyTemplate(tpl: typeof TEMPLATES[number]) {
    setFields(tpl.fields.map(f => ({ ...f, id: uid() })))
  }

  function addField() {
    setFields(prev => [...prev, { id: uid(), label: '', type: 'text', required: false }])
  }

  function removeField(idx: number) {
    setFields(prev => prev.filter((_, i) => i !== idx))
  }

  function updateField(idx: number, key: string, value: any) {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f))
  }

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return }
    const updated = [...fields]
    const [moved] = updated.splice(dragIdx, 1)
    updated.splice(idx, 0, moved)
    setFields(updated)
    setDragIdx(null)
    setDragOverIdx(null)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      kennel_id: kennelId,
      owner_id: userId,
      name: formName.trim() || 'Formulario de contacto',
      fields: fields,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    if (formId) {
      await supabase.from('kennel_forms').update(payload).eq('id', formId)
    } else {
      const { data } = await supabase.from('kennel_forms').insert(payload).select('id').single()
      if (data) setFormId(data.id)
    }
    setSaving(false)
    router.refresh()
  }

  function copyLink() {
    if (!formId) return
    const url = `${window.location.origin}/form/${kennelId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-xl z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D74709]" />
            <h2 className="text-lg font-semibold">Constructor de formulario</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Form name + active toggle */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Nombre del formulario</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
              </div>
              <div className="pt-5">
                <button onClick={() => setIsActive(!isActive)}
                  className={`w-10 h-5 rounded-full transition relative ${isActive ? 'bg-green-500' : 'bg-white/20'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${isActive ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Share link */}
            {formId && (
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-2">
                <input type="text" readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/form/${kennelId}`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 focus:outline-none" />
                <button onClick={copyLink} className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition flex items-center gap-1">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <a href={`/form/${kennelId}`} target="_blank" rel="noopener" className="px-2 py-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Fixed fields info */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">Campos fijos (siempre incluidos)</p>
              <div className="flex flex-wrap gap-1.5">
                {['Nombre', 'Apellidos', 'Email', 'Telefono', 'Ciudad', 'Pais'].map(f => (
                  <span key={f} className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">{f}</span>
                ))}
              </div>
            </div>

            {/* Templates */}
            {fields.length === 0 && (
              <div>
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">Plantillas rapidas</p>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map(tpl => (
                    <button key={tpl.name} onClick={() => applyTemplate(tpl)}
                      className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-left hover:border-[#D74709]/30 transition">
                      <p className="text-xs font-semibold">{tpl.name}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom fields */}
            <div>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">
                Campos personalizados {fields.length > 0 && `(${fields.length})`}
              </p>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(idx) }}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                    onDrop={() => handleDrop(idx)}
                    className={`bg-white/[0.03] border rounded-lg p-3 space-y-2 transition ${
                      dragOverIdx === idx && dragIdx !== idx ? 'border-[#D74709]/50' : 'border-white/5'
                    } ${dragIdx === idx ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-white/15 cursor-grab flex-shrink-0" />
                      <input type="text" value={field.label} onChange={e => updateField(idx, 'label', e.target.value)}
                        placeholder="Nombre del campo"
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none" />
                      <select value={field.type} onChange={e => updateField(idx, 'type', e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-[#D74709] focus:outline-none appearance-none w-24">
                        <option value="text">Texto</option>
                        <option value="select">Seleccion</option>
                        <option value="file">Archivo</option>
                      </select>
                      <button onClick={() => removeField(idx)} className="text-white/20 hover:text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {field.type === 'select' && (
                      <input type="text" value={field.options || ''} onChange={e => updateField(idx, 'options', e.target.value)}
                        placeholder="Opciones separadas por coma (ej: Opcion 1,Opcion 2)"
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder:text-white/20 focus:border-[#D74709] focus:outline-none" />
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addField}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/10 text-xs text-white/40 hover:text-[#D74709] hover:border-[#D74709]/30 transition">
                <Plus className="w-3.5 h-3.5" /> Anadir campo
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving || loading}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar formulario'}
          </button>
        </div>
      </div>
    </>
  )
}
