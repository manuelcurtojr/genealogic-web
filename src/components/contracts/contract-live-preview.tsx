'use client'

/**
 * ContractLivePreview — preview en vivo del contrato (columna derecha del
 * fill-form). Interpola los `{{tokens}}` de la plantilla con los valores
 * actuales del formulario y renderiza markdown a HTML.
 *
 * Tokens sin valor → BLANK_TOKEN (`__________________`) para que se vea
 * visualmente qué falta por rellenar.
 *
 * Es 100% client — no toca BBDD ni servidor. Cambios de valores en el
 * form (a través del padre) → re-render instantáneo.
 */

import { useMemo } from 'react'
import { interpolateTemplateWithBlanks, BLANK_TOKEN } from '@/lib/contracts/interpolate'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { useT } from '@/components/i18n/locale-provider'
import { FileText, AlertCircle } from 'lucide-react'

interface Props {
  /** Markdown crudo de la plantilla (con `{{tokens}}` sin sustituir). */
  templateBody: string
  /** Valores actuales del formulario (token → valor). */
  values: Record<string, string>
  /** Variables que VIENEN DEL CRIADERO/BBDD y no se editan en el form
   *  (legalName, legalId, etc.). Se mergean al final. */
  kennelVars: Record<string, string | null | undefined>
  /** Título del contrato (mostrado arriba del preview). */
  title: string
}

export default function ContractLivePreview({
  templateBody, values, kennelVars, title,
}: Props) {
  const t = useT()

  // Resolver el contrato: kennelVars como base + values del form encima.
  // Los valores del form ganan, EXCEPTO en los tokens "kennel-only" donde
  // siempre manda kennelVars (la UI ni siquiera deja editarlos).
  const html = useMemo(() => {
    const merged: Record<string, string | null | undefined> = {}
    for (const [k, v] of Object.entries(kennelVars)) merged[k] = v
    for (const [k, v] of Object.entries(values)) {
      if (v != null && String(v).trim() !== '') merged[k] = v
    }
    const interpolated = interpolateTemplateWithBlanks(templateBody, merged)
    return renderContractMarkdown(interpolated)
  }, [templateBody, values, kennelVars])

  // Conteo de blanks restantes — útil para advertencia visual
  const blanksRemaining = useMemo(() => {
    return (html.match(new RegExp(BLANK_TOKEN, 'g')) || []).length
  }, [html])

  return (
    <div className="flex flex-col h-full">
      {/* Header del preview */}
      <div className="sticky top-0 z-10 bg-canvas/95 backdrop-blur border-b border-hairline px-1 py-2.5 mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted flex-shrink-0" />
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">
            {t('Vista previa')}
          </span>
        </div>
        {blanksRemaining > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <AlertCircle className="h-3 w-3" />
            {blanksRemaining} {blanksRemaining === 1 ? t('hueco por rellenar') : t('huecos por rellenar')}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-hairline bg-canvas">
        <div className="px-6 sm:px-10 py-8 sm:py-10">
          <h2 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-ink mb-6 pb-4 border-b border-hairline">
            {title}
          </h2>
          <article
            className="contract-preview prose prose-sm max-w-none min-w-0 overflow-x-hidden break-words text-[13.5px] leading-[1.65] text-ink"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}
