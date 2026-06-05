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
import { Save, Check, Loader2, Eye, FileText, Star, Trash2 } from 'lucide-react'
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

  return (
    <div className="space-y-5">
      {/* Header: nombre + estado guardado + acciones */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#FE6620] mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> {t('Plantilla')} — {kennelName}
            {defaultForKind && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FE6620] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                <Star className="h-2.5 w-2.5 fill-current" />
                {defaultForKind === 'delivery' ? t('Default · Entrega') : t('Default · Reserva')}
              </span>
            )}
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Nombre de la plantilla')}
            className="w-full text-[24px] sm:text-[28px] font-semibold tracking-[-0.025em] text-ink bg-transparent border-0 outline-none focus:ring-0 placeholder:text-muted/50 leading-tight"
            maxLength={120}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SaveBadge state={saveState} />
          {/* Toggle: marcar esta plantilla como default de Reserva, Entrega,
              ambas (clic en ambas chips) o ninguna (clic en la activa). */}
          <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface-soft p-0.5 border border-hairline">
            <DefaultKindChip
              active={defaultForKind === 'reservation'}
              onClick={() => handleSetDefault(defaultForKind === 'reservation' ? null : 'reservation')}
              label={t('Default · Reserva')}
            />
            <DefaultKindChip
              active={defaultForKind === 'delivery'}
              onClick={() => handleSetDefault(defaultForKind === 'delivery' ? null : 'delivery')}
              label={t('Default · Entrega')}
            />
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition"
            aria-label={t('Borrar plantilla')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-[12.5px] text-rose-700">
          {error}
        </div>
      )}

      {/* Tabs mobile */}
      <div className="md:hidden inline-flex rounded-lg bg-surface-soft p-1">
        <TabBtn active={tab === 'edit'} onClick={() => setTab('edit')}>{t('Editar')}</TabBtn>
        <TabBtn active={tab === 'preview'} onClick={() => setTab('preview')}>
          <Eye className="h-3.5 w-3.5 inline mr-1" /> {t('Vista previa')}
        </TabBtn>
      </div>

      {/* Split editor / preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[60vh]">
        {/* Editor */}
        <div className={`${tab === 'preview' ? 'hidden md:block' : ''}`}>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block">
            Markdown
          </label>
          <textarea
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            spellCheck
            placeholder={t('# Contrato de compraventa de cachorro\n\nEmpieza a escribir aquí…')}
            className="w-full min-h-[60vh] rounded-xl border border-hairline bg-canvas px-4 py-3.5 text-[13.5px] text-ink font-mono leading-[1.55] resize-y focus:outline-none focus:border-ink/30 transition-colors"
          />
          <details className="mt-2 group">
            <summary className="cursor-pointer text-[11px] text-muted hover:text-ink transition list-none inline-flex items-center gap-1">
              <span>{t('Variables disponibles ↓')}</span>
            </summary>
            <div className="mt-2 rounded-lg border border-hairline bg-surface-soft p-3 text-[11.5px] text-body leading-relaxed">
              <p className="mb-2 text-muted">
                {t('Escribe')} <code className="bg-canvas px-1 rounded">{'{{nombreVariable}}'}</code> {t('donde quieras que se inserten datos de la reserva al crear el contrato. Si la variable no tiene valor, queda en blanco.')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                <div><code className="text-[#FE6620]">{'{{kennelName}}'}</code> {t('Nombre del criadero')}</div>
                <div><code className="text-[#FE6620]">{'{{kennelAddress}}'}</code> {t('Domicilio del criadero')}</div>
                <div><code className="text-[#FE6620]">{'{{clientName}}'}</code> {t('Nombre del cliente')}</div>
                <div><code className="text-[#FE6620]">{'{{clientEmail}}'}</code> {t('Email del cliente')}</div>
                <div><code className="text-[#FE6620]">{'{{clientId}}'}</code> {t('DNI/NIE del cliente')}</div>
                <div><code className="text-[#FE6620]">{'{{clientAddress}}'}</code> {t('Dirección del cliente')}</div>
                <div><code className="text-[#FE6620]">{'{{dogName}}'}</code> {t('Nombre del cachorro')}</div>
                <div><code className="text-[#FE6620]">{'{{breed}}'}</code> {t('Raza')}</div>
                <div><code className="text-[#FE6620]">{'{{birthDate}}'}</code> {t('Fecha de nacimiento')}</div>
                <div><code className="text-[#FE6620]">{'{{microchip}}'}</code> {t('Nº microchip')}</div>
                <div><code className="text-[#FE6620]">{'{{registration}}'}</code> {t('Inscripción / LOE')}</div>
                <div><code className="text-[#FE6620]">{'{{totalPrice}}'}</code> {t('Precio total')}</div>
                <div><code className="text-[#FE6620]">{'{{depositAmount}}'}</code> {t('Importe de la señal')}</div>
                <div><code className="text-[#FE6620]">{'{{todayDate}}'}</code> {t('Fecha actual')}</div>
              </div>
            </div>
          </details>
        </div>

        {/* Preview */}
        <div className={`${tab === 'edit' ? 'hidden md:block' : ''}`}>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block">
            {t('Vista previa')}
          </label>
          <div
            className="contract-preview rounded-xl border border-hairline bg-canvas px-6 py-6 min-h-[60vh] overflow-y-auto text-[13.5px] text-ink leading-[1.6] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderContractMarkdown(bodyMd || `*${t('Vacío')}*`) }}
          />
        </div>
      </div>

      {/* Footer: save manual button (desktop) */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={() => doSave(name, bodyMd)}
          disabled={saveState === 'saving'}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-2.5 text-[13.5px] font-bold hover:opacity-90 disabled:opacity-50 transition"
        >
          {saveState === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {t('Guardar')}
        </button>
      </div>
    </div>
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
