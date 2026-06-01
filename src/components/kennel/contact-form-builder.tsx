'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  X, Loader2, Save, Check, Plus, GripVertical, Trash2, Eye,
  Type, Mail, Phone, AlignLeft, ChevronDownSquare, CircleDot, CheckSquare,
  Sparkles, FileText, Settings2,
} from 'lucide-react'
import {
  TEMPLATES, getEffectiveConfig,
  type ContactFormConfig, type FormField, type FieldType, type FieldMap,
} from '@/lib/kennel/contact-form'
import { useT } from '@/components/i18n/locale-provider'

const FIELD_TYPES: { value: FieldType; label: string; icon: any }[] = [
  { value: 'text', label: 'Texto corto', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'tel', label: 'Teléfono', icon: Phone },
  { value: 'textarea', label: 'Texto largo', icon: AlignLeft },
  { value: 'select', label: 'Desplegable', icon: ChevronDownSquare },
  { value: 'radio', label: 'Selección única', icon: CircleDot },
  { value: 'checkbox', label: 'Casilla', icon: CheckSquare },
]

const MAP_OPTIONS: { value: FieldMap | ''; label: string }[] = [
  { value: '', label: '— (campo extra)' },
  { value: 'applicant_name', label: 'Nombre del solicitante' },
  { value: 'applicant_email', label: 'Email del solicitante' },
  { value: 'applicant_phone', label: 'Teléfono del solicitante' },
  { value: 'applicant_message', label: 'Mensaje principal' },
  { value: 'applicant_purpose', label: 'Propósito / función' },
  { value: 'applicant_country', label: 'País' },
  { value: 'applicant_city', label: 'Ciudad' },
  { value: 'preference_sex', label: 'Sexo preferido' },
  { value: 'preference_color', label: 'Color preferido' },
]

interface Props {
  kennelId: string
  initialConfig: ContactFormConfig | null
  onClose: () => void
  onSaved?: () => void
}

export default function ContactFormBuilder({ kennelId, initialConfig, onClose, onSaved }: Props) {
  const t = useT()
  const router = useRouter()
  const [config, setConfig] = useState<ContactFormConfig>(() => getEffectiveConfig(initialConfig))
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const applyTemplate = (key: 'generic' | 'breeding') => {
    if (!confirm(t('Esto sobrescribirá los campos actuales. ¿Continuar?'))) return
    setConfig(TEMPLATES[key])
    setEditingFieldId(null)
  }

  const addField = (type: FieldType) => {
    const newId = `field_${Date.now().toString(36)}`
    const newField: FormField = {
      id: newId,
      type,
      label: t('Nueva pregunta'),
      required: false,
      ...(type === 'select' || type === 'radio' ? { options: [t('Opción 1'), t('Opción 2')] } : {}),
      ...(type === 'textarea' ? { rows: 4 } : {}),
    }
    setConfig((c) => ({ ...c, template: 'custom', fields: [...c.fields, newField] }))
    setEditingFieldId(newId)
  }

  const updateField = (id: string, patch: Partial<FormField>) => {
    setConfig((c) => ({
      ...c,
      template: 'custom',
      fields: c.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }))
  }

  const deleteField = (id: string) => {
    if (!confirm(t('¿Eliminar este campo?'))) return
    setConfig((c) => ({
      ...c,
      template: 'custom',
      fields: c.fields.filter((f) => f.id !== id),
    }))
    if (editingFieldId === id) setEditingFieldId(null)
  }

  const moveField = (id: string, dir: 'up' | 'down') => {
    setConfig((c) => {
      const idx = c.fields.findIndex((f) => f.id === id)
      if (idx === -1) return c
      const newIdx = dir === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= c.fields.length) return c
      const fields = [...c.fields]
      ;[fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]]
      return { ...c, template: 'custom', fields }
    })
  }

  const handleSave = async () => {
    setSaving(true); setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('kennels')
      .update({ contact_form_config: config })
      .eq('id', kennelId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
    onSaved?.()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl overflow-y-auto bg-canvas shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-hairline bg-canvas px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{t('Constructor')}</p>
              <h2 className="mt-0.5 text-[20px] font-semibold tracking-[-0.02em] text-ink">
                {t('Formulario de contacto')}
              </h2>
              <p className="mt-1 text-[12px] text-muted">
                {t('Configura las preguntas. Se usa en tu perfil estándar y en tu web personalizada.')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12px] font-medium text-body hover:bg-surface-soft"
              >
                <Eye className="h-3.5 w-3.5" /> {showPreview ? t('Editor') : t('Vista previa')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-1.5 text-[12px] font-medium text-on-primary hover:opacity-90 disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {saved ? t('Guardado') : t('Guardar')}
              </button>
              <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-soft hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {showPreview ? (
          <div className="p-5">
            <FormPreview config={config} />
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {/* Plantillas */}
            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {t('Plantillas rápidas')}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => applyTemplate('generic')}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    config.template === 'generic'
                      ? 'border-ink bg-ink/5'
                      : 'border-hairline bg-canvas hover:bg-surface-soft'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-card">
                      <FileText className="h-4 w-4 text-ink" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink">{t('Genérica')}</p>
                      <p className="mt-0.5 text-[12px] text-body">
                        {t('Nombre, email, teléfono y mensaje. Para contactos generales sin filtros.')}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => applyTemplate('breeding')}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    config.template === 'breeding'
                      ? 'border-ink bg-ink/5'
                      : 'border-hairline bg-canvas hover:bg-surface-soft'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-100 to-purple-100">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink">{t('Cría enfocada')}</p>
                      <p className="mt-0.5 text-[12px] text-body">
                        {t('Color, sexo, función (familia / guarda / trabajo) + descripción. Filtra leads serios.')}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              {config.template === 'custom' && (
                <p className="mt-2 text-[11.5px] italic text-muted">
                  {t('Configuración personalizada — has modificado los campos de una plantilla.')}
                </p>
              )}
            </section>

            {/* Lista de campos */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {t('Campos del formulario')} ({config.fields.length})
                </h3>
              </div>

              <ul className="space-y-2">
                {config.fields.map((field, i) => {
                  const isEditing = editingFieldId === field.id
                  return (
                    <li
                      key={field.id}
                      className={`rounded-xl border ${isEditing ? 'border-ink bg-surface-soft' : 'border-hairline bg-canvas'}`}
                    >
                      <div
                        className="flex items-center gap-2 p-3"
                        onClick={() => setEditingFieldId(isEditing ? null : field.id)}
                      >
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-grab text-muted"
                          title={t('Reordenar (usa los botones)')}
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                        <FieldTypeBadge type={field.type} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-ink">{field.label}</p>
                          <p className="text-[11px] text-muted">
                            {field.required ? `${t('Obligatorio')} · ` : `${t('Opcional')} · `}
                            {field.map_to ? `→ ${t(MAP_OPTIONS.find((m) => m.value === field.map_to)?.label || '')}` : t('extra')}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(field.id, 'up') }}
                            disabled={i === 0}
                            className="rounded p-1 text-muted hover:bg-surface-card hover:text-ink disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(field.id, 'down') }}
                            disabled={i === config.fields.length - 1}
                            className="rounded p-1 text-muted hover:bg-surface-card hover:text-ink disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteField(field.id) }}
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <FieldEditor
                          field={field}
                          onChange={(patch) => updateField(field.id, patch)}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>

              {/* Add field */}
              <details className="mt-3 rounded-xl border border-dashed border-hairline bg-surface-soft p-3">
                <summary className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-body hover:text-ink">
                  <Plus className="h-3.5 w-3.5" /> {t('Añadir campo')}
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {FIELD_TYPES.map((ft) => {
                    const Icon = ft.icon
                    return (
                      <button
                        key={ft.value}
                        onClick={() => addField(ft.value)}
                        className="flex flex-col items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-center transition-colors hover:bg-surface-card"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted" />
                        <span className="text-[11.5px] text-body">{t(ft.label)}</span>
                      </button>
                    )
                  })}
                </div>
              </details>
            </section>

            {/* Mensajes del form */}
            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {t('Textos del formulario')}
              </h3>
              <div className="space-y-3 rounded-xl border border-hairline bg-canvas p-4">
                <div>
                  <label className="block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                    {t('Botón de envío')}
                  </label>
                  <input
                    type="text"
                    value={config.submit_label || ''}
                    onChange={(e) => setConfig((c) => ({ ...c, submit_label: e.target.value }))}
                    placeholder={t('Enviar solicitud')}
                    className="mt-1 w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                    {t('Mensaje de éxito')}
                  </label>
                  <input
                    type="text"
                    value={config.success_message || ''}
                    onChange={(e) => setConfig((c) => ({ ...c, success_message: e.target.value }))}
                    placeholder={t('¡Gracias! Te responderemos pronto.')}
                    className="mt-1 w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Editor de un campo individual ────────────────────────────────

function FieldEditor({ field, onChange }: { field: FormField; onChange: (patch: Partial<FormField>) => void }) {
  const t = useT()
  return (
    <div className="space-y-3 border-t border-hairline px-4 pb-4 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            {t('Etiqueta visible')}
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="mt-1 w-full rounded-lg border border-hairline bg-canvas px-2.5 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            {t('Mapea a')}
          </label>
          <select
            value={field.map_to || ''}
            onChange={(e) => onChange({ map_to: (e.target.value || undefined) as FieldMap | undefined })}
            className="mt-1 w-full rounded-lg border border-hairline bg-canvas px-2.5 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none"
          >
            {MAP_OPTIONS.map((m) => (
              <option key={m.value || 'extra'} value={m.value}>{t(m.label)}</option>
            ))}
          </select>
        </div>
      </div>

      {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'textarea') && (
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            {t('Placeholder')}
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            className="mt-1 w-full rounded-lg border border-hairline bg-canvas px-2.5 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none"
          />
        </div>
      )}

      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            {t('Opciones (una por línea)')}
          </label>
          <textarea
            value={(field.options || []).join('\n')}
            onChange={(e) => onChange({ options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-hairline bg-canvas px-2.5 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none font-mono"
          />
        </div>
      )}

      <div>
        <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
          {t('Texto de ayuda (opcional)')}
        </label>
        <input
          type="text"
          value={field.helper || ''}
          onChange={(e) => onChange({ helper: e.target.value })}
          placeholder={t('Texto pequeño debajo del campo')}
          className="mt-1 w-full rounded-lg border border-hairline bg-canvas px-2.5 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-[13px] text-ink">
        <input
          type="checkbox"
          checked={field.required || false}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="h-4 w-4 rounded border-hairline"
        />
        {t('Obligatorio')}
      </label>
    </div>
  )
}

function FieldTypeBadge({ type }: { type: FieldType }) {
  const meta = FIELD_TYPES.find((x) => x.value === type)
  const Icon = meta?.icon || Type
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-card text-muted">
      <Icon className="h-3.5 w-3.5" />
    </div>
  )
}

// ─── Vista previa del form (no funcional, solo render) ─────────

function FormPreview({ config }: { config: ContactFormConfig }) {
  const t = useT()
  return (
    <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-hairline bg-canvas p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{t('Vista previa')}</p>
      {config.fields.map((f) => (
        <div key={f.id}>
          <label className="block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
            {f.label}{f.required && <span className="text-rose-600"> *</span>}
          </label>
          {f.type === 'textarea' ? (
            <textarea rows={f.rows || 4} placeholder={f.placeholder} disabled
              className="mt-1 w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-[13.5px] text-ink" />
          ) : f.type === 'select' ? (
            <select disabled className="mt-1 w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-[13.5px] text-ink">
              <option>{t('— Seleccionar —')}</option>
              {(f.options || []).map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : f.type === 'radio' ? (
            <div className="mt-1.5 space-y-1.5">
              {(f.options || []).map((o) => (
                <label key={o} className="flex items-center gap-2 text-[13.5px] text-ink">
                  <input type="radio" name={f.id} disabled />
                  {o}
                </label>
              ))}
            </div>
          ) : f.type === 'checkbox' ? (
            <div className="mt-1.5 space-y-1.5">
              {(f.options || []).map((o) => (
                <label key={o} className="flex items-center gap-2 text-[13.5px] text-ink">
                  <input type="checkbox" disabled />
                  {o}
                </label>
              ))}
            </div>
          ) : (
            <input type={f.type} placeholder={f.placeholder} disabled
              className="mt-1 w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-[13.5px] text-ink" />
          )}
          {f.helper && <p className="mt-1 text-[11.5px] text-muted">{f.helper}</p>}
        </div>
      ))}
      <button disabled className="w-full rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary opacity-60">
        {config.submit_label || t('Enviar')}
      </button>
    </div>
  )
}
