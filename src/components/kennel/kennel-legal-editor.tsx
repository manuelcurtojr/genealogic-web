'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Save, Check, ExternalLink, Pencil, RotateCcw } from 'lucide-react'
import {
  upsertKennelLegalOverride,
  deleteKennelLegalOverride,
} from '@/lib/kennel/legal-actions'
import type { LegalDocType } from '@/lib/kennel/legal'
import { useT } from '@/components/i18n/locale-provider'

interface DocRow {
  type: LegalDocType
  label: string
  slug: string
  hasOverride: boolean
  title: string
  body_md: string
}
interface LegalData {
  legal_name: string | null
  legal_id: string | null
  legal_address: string | null
  legal_email: string | null
}

export default function KennelLegalEditor({
  kennelId, kennelSlug, legal, docs,
}: {
  kennelId: string
  kennelSlug: string
  legal: LegalData
  docs: DocRow[]
}) {
  const t = useT()
  // ── Datos legales (placeholders) ──────────────────────────────────────
  const [form, setForm] = useState({
    legal_name: legal.legal_name || '',
    legal_id: legal.legal_id || '',
    legal_address: legal.legal_address || '',
    legal_email: legal.legal_email || '',
  })
  const [savingData, setSavingData] = useState(false)
  const [savedData, setSavedData] = useState(false)
  const [dataErr, setDataErr] = useState<string | null>(null)

  const saveData = async () => {
    setSavingData(true); setDataErr(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('kennels')
      .update({
        legal_name: form.legal_name.trim() || null,
        legal_id: form.legal_id.trim() || null,
        legal_address: form.legal_address.trim() || null,
        legal_email: form.legal_email.trim() || null,
      })
      .eq('id', kennelId)
    setSavingData(false)
    if (error) { setDataErr(error.message); return }
    setSavedData(true); setTimeout(() => setSavedData(false), 2500)
  }

  // ── Overrides de documentos (avanzado) ────────────────────────────────
  const [editing, setEditing] = useState<LegalDocType | null>(null)
  const [docDraft, setDocDraft] = useState<{ title: string; body_md: string }>({ title: '', body_md: '' })
  const [docState, setDocState] = useState(docs)
  const [docBusy, setDocBusy] = useState(false)
  const [docErr, setDocErr] = useState<string | null>(null)

  const startEdit = (d: DocRow) => {
    setEditing(d.type)
    setDocDraft({ title: d.title, body_md: d.body_md })
    setDocErr(null)
  }

  const saveOverride = async () => {
    if (!editing) return
    setDocBusy(true); setDocErr(null)
    try {
      await upsertKennelLegalOverride({
        kennelId, docType: editing, title: docDraft.title, bodyMd: docDraft.body_md,
      })
      setDocState(prev => prev.map(d =>
        d.type === editing ? { ...d, hasOverride: true, title: docDraft.title, body_md: docDraft.body_md } : d,
      ))
      setEditing(null)
    } catch (e) {
      setDocErr(e instanceof Error ? e.message : t('Error al guardar'))
    } finally {
      setDocBusy(false)
    }
  }

  const resetToGlobal = async (type: LegalDocType) => {
    setDocBusy(true); setDocErr(null)
    try {
      await deleteKennelLegalOverride({ kennelId, docType: type })
      setDocState(prev => prev.map(d =>
        d.type === type ? { ...d, hasOverride: false, body_md: '' } : d,
      ))
      if (editing === type) setEditing(null)
    } catch (e) {
      setDocErr(e instanceof Error ? e.message : t('Error'))
    } finally {
      setDocBusy(false)
    }
  }

  const field = (
    key: keyof typeof form, label: string, placeholder: string, help?: string,
  ) => (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
      />
      {help && <p className="mt-1 text-[11.5px] text-muted">{help}</p>}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* ── Datos legales ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-[17px] font-semibold text-ink">{t('Datos legales de tu criadero')}</h2>
        <p className="text-[13px] text-muted mt-1 max-w-2xl">
          {t('Estos datos rellenan automáticamente tus documentos legales (aviso legal, privacidad, cookies y términos). Si los dejas vacíos, se usa tu nombre y ubicación, y los huecos sin completar se marcan entre corchetes.')}
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('legal_name', t('Razón social / titular'), t('Ej: Manuel Curtó SL'), t('Quién es el responsable legal del sitio.'))}
          {field('legal_id', t('NIF / CIF / DNI'), t('Ej: B12345678'))}
          {field('legal_email', t('Email de contacto legal'), t('Ej: info@tucriadero.com'), t('Para ejercer derechos RGPD.'))}
          {field('legal_address', t('Domicilio'), t('Calle, código postal, localidad'))}
        </div>

        {dataErr && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">{dataErr}</div>
        )}

        <button
          onClick={saveData}
          disabled={savingData}
          className="mt-4 inline-flex items-center gap-1.5 bg-ink text-on-primary rounded-lg px-4 py-2 text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
        >
          {savedData ? <><Check className="w-4 h-4" /> {t('Guardado')}</> : <><Save className="w-4 h-4" /> {savingData ? t('Guardando…') : t('Guardar datos')}</>}
        </button>
      </section>

      {/* ── Documentos ────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-[17px] font-semibold text-ink">{t('Tus documentos legales')}</h2>
        <p className="text-[13px] text-muted mt-1 max-w-2xl">
          {t('Por defecto usan las plantillas de Genealogic con tus datos. Puedes verlos o, si lo necesitas, escribir tu propia versión.')}
        </p>

        {docErr && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">{docErr}</div>
        )}

        <div className="mt-4 space-y-2.5">
          {docState.map(d => (
            <div key={d.type} className="rounded-xl border border-hairline bg-canvas">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-ink">{d.label}</p>
                  <p className="text-[11.5px] text-muted">
                    {d.hasOverride ? t('Versión personalizada') : t('Plantilla por defecto')}
                  </p>
                </div>
                <Link
                  href={`/kennels/${kennelSlug}/legal/${d.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[12.5px] text-body hover:text-ink transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> {t('Ver')}
                </Link>
                {d.hasOverride && (
                  <button
                    onClick={() => resetToGlobal(d.type)}
                    disabled={docBusy}
                    className="inline-flex items-center gap-1 text-[12.5px] text-body hover:text-ink transition disabled:opacity-50"
                    title={t('Volver a la plantilla por defecto')}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {t('Restablecer')}
                  </button>
                )}
                <button
                  onClick={() => startEdit(d)}
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink hover:opacity-80 transition"
                >
                  <Pencil className="w-3.5 h-3.5" /> {d.hasOverride ? t('Editar') : t('Personalizar')}
                </button>
              </div>

              {editing === d.type && (
                <div className="border-t border-hairline p-4 space-y-3 bg-surface-soft">
                  <input
                    type="text"
                    value={docDraft.title}
                    onChange={e => setDocDraft(p => ({ ...p, title: e.target.value }))}
                    placeholder={t('Título')}
                    className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-[14px] font-semibold text-ink focus:border-ink focus:outline-none"
                  />
                  <textarea
                    value={docDraft.body_md}
                    onChange={e => setDocDraft(p => ({ ...p, body_md: e.target.value }))}
                    rows={16}
                    spellCheck={false}
                    placeholder={t('Escribe tu versión en Markdown. Puedes usar placeholders como {{kennel_legal_name}}.')}
                    className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-[13px] font-mono leading-relaxed text-ink focus:border-ink focus:outline-none resize-y"
                  />
                  <p className="text-[11.5px] text-muted">
                    {t('Placeholders:')} <code>{'{{kennel_legal_name}}'}</code>, <code>{'{{kennel_legal_id}}'}</code>,
                    {' '}<code>{'{{kennel_legal_address}}'}</code>, <code>{'{{kennel_legal_email}}'}</code>,
                    {' '}<code>{'{{kennel_name}}'}</code>, <code>{'{{date}}'}</code>. {t('Markdown:')} <code>## Título</code>, <code>**negrita**</code>, {t('listas con')} <code>-</code>.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveOverride}
                      disabled={docBusy || !docDraft.title.trim() || !docDraft.body_md.trim()}
                      className="inline-flex items-center gap-1.5 bg-ink text-on-primary rounded-lg px-4 py-2 text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
                    >
                      <Save className="w-4 h-4" /> {docBusy ? t('Guardando…') : t('Guardar versión')}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-[13px] text-body hover:text-ink px-3 py-2 transition"
                    >
                      {t('Cancelar')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
