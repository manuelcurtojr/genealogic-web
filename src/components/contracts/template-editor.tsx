/**
 * TemplateEditor — editor de UNA plantilla de contrato.
 *
 * Layout split: a la izquierda el textarea Markdown, a la derecha el
 * preview renderizado (HTML del renderContractMarkdown). En mobile cae
 * a tabs (Editar / Vista previa).
 *
 * Guarda con debounce silencioso (cada cambio inicia un timer; si pasan
 * 1.5s sin nuevos cambios, persiste). Indicador "Guardado" / "Guardando"
 * en el header.
 *
 * También soporta guardado manual (Cmd/Ctrl+S) y un botón "Guardar"
 * explícito.
 */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Check, Loader2, Eye, FileText, Star, Trash2, Lightbulb, Pencil } from 'lucide-react'
import {
  updateContractTemplate,
  deleteContractTemplate,
  setDefaultContractTemplate,
} from '@/lib/contracts/templates-actions'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  templateId: string
  initialName: string
  initialBodyMd: string
  /** null = no es default de ningún kind; 'reservation'/'delivery' = es la
   *  default de ese tipo de contrato para el criadero. */
  defaultForKind: 'reservation' | 'delivery' | null
  kennelName: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_MS = 1500

export default function TemplateEditor({
  templateId, initialName, initialBodyMd, defaultForKind: initialDefaultForKind, kennelName,
}: Props) {
  const t = useT()
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [bodyMd, setBodyMd] = useState(initialBodyMd)
  const [defaultForKind, setDefaultForKind] = useState<'reservation' | 'delivery' | null>(initialDefaultForKind)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef({ name: initialName, body: initialBodyMd })

  const doSave = useCallback(async (nextName: string, nextBody: string) => {
    if (
      nextName === lastSavedRef.current.name &&
      nextBody === lastSavedRef.current.body
    ) {
      return
    }
    setSaveState('saving')
    setError(null)
    try {
      await updateContractTemplate({
        id: templateId,
        name: nextName,
        bodyMd: nextBody,
      })
      lastSavedRef.current = { name: nextName, body: nextBody }
      setSaveState('saved')
      // Vuelve a "idle" tras 2s para no quedarse el badge pegado
      setTimeout(() => setSaveState(s => (s === 'saved' ? 'idle' : s)), 2000)
    } catch (e) {
      setSaveState('error')
      setError((e as Error).message || t('Error guardando'))
    }
  }, [templateId, t])

  // Autosave con debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      doSave(name, bodyMd)
    }, AUTOSAVE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [name, bodyMd, doSave])

  // Cmd/Ctrl+S → guardado manual
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        doSave(name, bodyMd)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [name, bodyMd, doSave])

  async function handleSetDefault(kind: 'reservation' | 'delivery' | null) {
    try {
      await setDefaultContractTemplate(templateId, kind)
      setDefaultForKind(kind)
      router.refresh()
    } catch (e) {
      alert((e as Error).message || t('Error marcando por defecto'))
    }
  }

  async function handleDelete() {
    if (!confirm(t('¿Borrar esta plantilla? No se podrá recuperar.'))) return
    try {
      await deleteContractTemplate(templateId)
      router.push('/contratos')
    } catch (e) {
      alert((e as Error).message || t('Error borrando la plantilla'))
    }
  }

  function insertToken(token: string) {
    setBodyMd((cur) => cur + `{{${token}}}`)
  }

  return (
    <div className="space-y-5">
      {/* ─── Sticky header con identidad de plantilla + acciones ─── */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 -mt-6 px-4 sm:px-6 pt-5 pb-4 bg-canvas/95 backdrop-blur border-b border-hairline">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#FE6620] mb-1 flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> {t('Plantilla')} — {kennelName}
              {defaultForKind && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FE6620] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  {defaultForKind === 'delivery' ? t('Default · Entrega') : t('Default · Reserva')}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 group">
              <Pencil className="h-3.5 w-3.5 text-muted/40 group-focus-within:text-[#FE6620] transition-colors flex-shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('Nombre de la plantilla')}
                className="flex-1 min-w-0 text-[22px] sm:text-[26px] font-bold tracking-[-0.025em] text-ink bg-transparent border-0 outline-none focus:ring-0 placeholder:text-muted/50 leading-tight"
                maxLength={120}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SaveBadge state={saveState} />
            <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface-soft p-0.5 border border-hairline">
              <DefaultKindChip
                active={defaultForKind === 'reservation'}
                onClick={() => handleSetDefault(defaultForKind === 'reservation' ? null : 'reservation')}
                label={t('Reserva')}
              />
              <DefaultKindChip
                active={defaultForKind === 'delivery'}
                onClick={() => handleSetDefault(defaultForKind === 'delivery' ? null : 'delivery')}
                label={t('Entrega')}
              />
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition"
              aria-label={t('Borrar plantilla')}
              title={t('Eliminar plantilla')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => doSave(name, bodyMd)}
              disabled={saveState === 'saving'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-3.5 py-2 text-[12.5px] font-bold hover:opacity-90 disabled:opacity-50 transition shadow-sm"
            >
              {saveState === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {t('Guardar')}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-[12.5px] text-rose-700">
          {error}
        </div>
      )}

      {/* Tabs mobile */}
      <div className="md:hidden inline-flex rounded-lg bg-surface-soft p-1 border border-hairline">
        <TabBtn active={tab === 'edit'} onClick={() => setTab('edit')}>
          <Pencil className="h-3.5 w-3.5 inline mr-1" />
          {t('Editar')}
        </TabBtn>
        <TabBtn active={tab === 'preview'} onClick={() => setTab('preview')}>
          <Eye className="h-3.5 w-3.5 inline mr-1" />
          {t('Vista previa')}
        </TabBtn>
      </div>

      {/* Split editor / preview */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 min-h-[65vh]">
        {/* ─── Editor (col izquierda) ─── */}
        <div className={`flex flex-col min-w-0 ${tab === 'preview' ? 'hidden md:flex' : ''}`}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
              Markdown · {t('Editor')}
            </label>
            <span className="text-[11px] text-muted tabular-nums">
              {bodyMd.length.toLocaleString('es-ES')} {t('chars')}
            </span>
          </div>
          <textarea
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            spellCheck
            placeholder={t('# Contrato de compraventa de cachorro\n\nEmpieza a escribir aquí…')}
            className="flex-1 w-full min-h-[60vh] rounded-xl border border-hairline bg-canvas px-4 py-3.5 text-[13.5px] text-ink font-mono leading-[1.55] resize-y focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-colors"
          />
          <TokenReference onInsert={insertToken} t={t} />
        </div>

        {/* ─── Preview (col derecha) — estilo hoja de papel ─── */}
        <div className={`flex flex-col min-w-0 ${tab === 'edit' ? 'hidden md:flex' : ''}`}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted inline-flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              {t('Vista previa')}
            </label>
            <span className="text-[10.5px] text-muted italic">
              {t('Los')} {'{{tokens}}'} {t('se rellenan con datos reales al usar la plantilla')}
            </span>
          </div>
          <div className="flex-1 rounded-xl border border-hairline bg-surface-soft/40 overflow-y-auto min-h-[60vh] p-4">
            <div
              className="bg-canvas rounded-lg shadow-sm border border-hairline px-6 sm:px-8 py-6 sm:py-8 contract-preview prose prose-sm max-w-none text-[13.5px] text-ink leading-[1.65]"
              dangerouslySetInnerHTML={{ __html: renderContractMarkdown(bodyMd || `*${t('Empieza a escribir para ver la vista previa…')}*`) }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TokenReference — panel inferior con chips clicables ─────────────────
// Reemplaza el <details> anterior por chips siempre visibles que al
// clicar INSERTAN el token en el editor — mucho más útil que solo leer.

const KNOWN_TOKENS: Array<{ token: string; label: string; group: string }> = [
  // Criador
  { token: 'legalName', label: 'Razón social criador', group: 'Criador' },
  { token: 'legalId', label: 'NIF/CIF criador', group: 'Criador' },
  { token: 'legalAddress', label: 'Domicilio criador', group: 'Criador' },
  { token: 'representative', label: 'Representante legal', group: 'Criador' },
  { token: 'representativeId', label: 'DNI representante', group: 'Criador' },
  { token: 'signCity', label: 'Ciudad de firma', group: 'Criador' },
  { token: 'jurisdiction', label: 'Jurisdicción', group: 'Criador' },
  // Cliente
  { token: 'clientName', label: 'Nombre cliente', group: 'Cliente' },
  { token: 'clientEmail', label: 'Email cliente', group: 'Cliente' },
  { token: 'clientId', label: 'DNI/NIE cliente', group: 'Cliente' },
  { token: 'clientAddress', label: 'Dirección cliente', group: 'Cliente' },
  // Cachorro
  { token: 'dogName', label: 'Nombre cachorro', group: 'Cachorro' },
  { token: 'breed', label: 'Raza', group: 'Cachorro' },
  { token: 'sex', label: 'Sexo', group: 'Cachorro' },
  { token: 'color', label: 'Color', group: 'Cachorro' },
  { token: 'birthDate', label: 'Fecha nacimiento', group: 'Cachorro' },
  { token: 'microchip', label: 'Microchip', group: 'Cachorro' },
  { token: 'registration', label: 'Nº registro / LOE', group: 'Cachorro' },
  { token: 'purpose', label: 'Función', group: 'Cachorro' },
  { token: 'preferences', label: 'Preferencias', group: 'Cachorro' },
  // Económico
  { token: 'totalPrice', label: 'Precio total', group: 'Económico' },
  { token: 'depositAmount', label: 'Señal', group: 'Económico' },
  { token: 'finalAmount', label: 'Pago final', group: 'Económico' },
  // Fechas
  { token: 'todayDate', label: 'Fecha hoy', group: 'Fechas' },
  { token: 'reservationDate', label: 'Fecha reserva', group: 'Fechas' },
]

function TokenReference({
  onInsert, t,
}: { onInsert: (token: string) => void; t: (k: string) => string }) {
  const grouped = KNOWN_TOKENS.reduce<Record<string, typeof KNOWN_TOKENS>>((acc, k) => {
    if (!acc[k.group]) acc[k.group] = []
    acc[k.group].push(k)
    return acc
  }, {})

  return (
    <details className="mt-3 group" open>
      <summary className="cursor-pointer text-[11.5px] font-semibold text-body hover:text-ink transition list-none inline-flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-[#FE6620]" />
        {t('Tokens disponibles')} <span className="text-muted font-normal">— {t('clic para insertar al final')}</span>
      </summary>
      <div className="mt-2 rounded-xl border border-hairline bg-surface-soft/50 p-3 space-y-2.5">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">{t(group)}</p>
            <div className="flex flex-wrap gap-1">
              {items.map((k) => (
                <button
                  key={k.token}
                  type="button"
                  onClick={() => onInsert(k.token)}
                  title={`Insertar {{${k.token}}} — ${k.label}`}
                  className="inline-flex items-center gap-1 rounded-md bg-canvas hover:bg-[#FE6620] hover:text-white border border-hairline hover:border-[#FE6620] px-2 py-1 text-[11px] font-mono text-[#FE6620] hover:text-white transition-colors"
                >
                  {'{{'}{k.token}{'}}'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}

function SaveBadge({ state }: { state: SaveState }) {
  const t = useT()
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
        <Loader2 className="h-3 w-3 animate-spin" /> {t('Guardando…')}
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-[11.5px] text-emerald-700">
        <Check className="h-3 w-3" /> {t('Guardado')}
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[11.5px] text-rose-700">
        {t('Error al guardar')}
      </span>
    )
  }
  return null
}

function DefaultKindChip({
  active, onClick, label,
}: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={active ? 'Default actual — clic para desmarcar' : 'Marcar esta plantilla como default'}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
        active
          ? 'bg-[#FE6620] text-white'
          : 'text-muted hover:text-ink hover:bg-canvas'
      }`}
    >
      <Star className={`h-3 w-3 ${active ? 'fill-current' : ''}`} />
      {label}
    </button>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition ${
        active ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
