'use client'

/**
 * KennelLegalDataForm — formulario de DATOS LEGALES del criadero.
 *
 * Extracción de la sección "Datos legales" de KennelLegalEditor, reusable
 * en dos sitios:
 *
 *  1. /kennel/legal (nuevo): accesible a cualquier dueño de kennel, sin
 *     gate de extensión. Es lo mínimo para generar contratos válidos.
 *
 *  2. /kennel/contenido/legal (existente): junto con los overrides de
 *     documentos públicos (privacidad, T&Cs, aviso legal, cookies) que sí
 *     requieren la extensión Web (porque solo aplican a la web pública).
 *
 * Persiste 8 campos en `kennels.legal_*` directamente desde el cliente con
 * Supabase RLS (el owner tiene update on kennels.* via policy).
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Check } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

interface LegalData {
  legal_name: string | null
  legal_id: string | null
  legal_address: string | null
  legal_email: string | null
  legal_representative: string | null
  legal_representative_id: string | null
  sign_city: string | null
  jurisdiction: string | null
}

interface Props {
  kennelId: string
  legal: LegalData
}

export default function KennelLegalDataForm({ kennelId, legal }: Props) {
  const t = useT()
  const [form, setForm] = useState({
    legal_name: legal.legal_name || '',
    legal_id: legal.legal_id || '',
    legal_address: legal.legal_address || '',
    legal_email: legal.legal_email || '',
    legal_representative: legal.legal_representative || '',
    legal_representative_id: legal.legal_representative_id || '',
    sign_city: legal.sign_city || '',
    jurisdiction: legal.jurisdiction || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    setSaving(true); setErr(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('kennels')
      .update({
        legal_name: form.legal_name.trim() || null,
        legal_id: form.legal_id.trim() || null,
        legal_address: form.legal_address.trim() || null,
        legal_email: form.legal_email.trim() || null,
        legal_representative: form.legal_representative.trim() || null,
        legal_representative_id: form.legal_representative_id.trim() || null,
        sign_city: form.sign_city.trim() || null,
        jurisdiction: form.jurisdiction.trim() || null,
      })
      .eq('id', kennelId)
    setSaving(false)
    if (error) { setErr(error.message); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const field = (
    key: keyof typeof form, label: string, placeholder: string, help?: string,
  ) => (
    <div>
      <label className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-[14px] text-ink placeholder:text-muted/60 focus:border-ink/40 focus:ring-2 focus:ring-ink/5 focus:outline-none transition-colors"
      />
      {help && <p className="mt-1 text-[11.5px] text-muted leading-snug">{help}</p>}
    </div>
  )

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('legal_name', t('Razón social / titular'), t('Ej: Manuel Curtó SL'), t('Quién es el responsable legal del criadero.'))}
        {field('legal_id', t('NIF / CIF / DNI'), t('Ej: B12345678'))}
        {field('legal_email', t('Email de contacto legal'), t('Ej: info@tucriadero.com'), t('Para ejercer derechos RGPD.'))}
        {field('legal_address', t('Domicilio'), t('Calle, código postal, localidad'))}
        {field('legal_representative', t('Representante legal'), t('Ej: D. Manuel Curtó'), t('Persona física que firma los contratos en nombre del criadero.'))}
        {field('legal_representative_id', t('DNI del representante'), t('Ej: 12345678Z'))}
        {field('sign_city', t('Ciudad de firma'), t('Ej: La Laguna'), t('Localidad donde se firman los contratos.'))}
        {field('jurisdiction', t('Jurisdicción (tribunales)'), t('Ej: Santa Cruz de Tenerife'), t('Juzgados y tribunales competentes en caso de controversia.'))}
      </div>

      {err && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">{err}</div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-ink text-on-primary rounded-lg px-4 py-2.5 text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
        >
          {saved ? (
            <><Check className="w-4 h-4" /> {t('Guardado')}</>
          ) : (
            <><Save className="w-4 h-4" /> {saving ? t('Guardando…') : t('Guardar datos legales')}</>
          )}
        </button>
        {saved && (
          <span className="text-[12.5px] text-emerald-700 font-medium">
            ✓ {t('Cambios aplicados')}
          </span>
        )}
      </div>
    </div>
  )
}
