'use client'

/**
 * ContractFillPanel — wrapper que une el ContractFillForm (izquierda) y el
 * ContractLivePreview (derecha) en un layout split.
 *
 * Layout:
 *  - Desktop (lg+): 2 columnas (40% form, 60% preview), altura natural.
 *    Cada panel scrollea independiente con su propio sticky header,
 *    capped a max-h-[80vh] para no dejar al usuario sin contexto.
 *  - Móvil: tabs (Formulario / Vista previa), cada uno ocupa lo que necesite.
 *
 * Estado compartido: los `values` del form se sincronizan al preview vía
 * callback `onValuesChange`. El preview reinterpola al instante (no
 * espera al server).
 *
 * "Modo avanzado": switch a editor de markdown libre vía prop callback.
 * El padre decide qué componente montar (este o ContractEditor markdown).
 */

import { useState } from 'react'
import { Eye, ListChecks } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import ContractFillForm from './contract-fill-form'
import ContractLivePreview from './contract-live-preview'

interface Props {
  reservationId: string
  contractId: string
  kind: 'reservation' | 'delivery'
  /** Markdown crudo de la plantilla con `{{tokens}}` sin sustituir.
   *  Si null → se usa la plantilla base del kind. */
  templateBody: string
  /** Título visible del contrato (arriba del preview). */
  contractTitle: string
  /** Valores iniciales del form (combinación de buildContractVars + saved). */
  initialValues: Record<string, string>
  /** Vars que vienen 100% de BBDD (legal_*) — no editables aquí. */
  kennelVars: Record<string, string | null | undefined>
  /** Si true, formulario disabled (el criador editó markdown a mano). */
  manualOverride: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSaveAction: (...args: any[]) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSendAction: (...args: any[]) => Promise<any>
  onAdvancedMode: () => void
}

export default function ContractFillPanel({
  reservationId, contractId, kind, templateBody, contractTitle,
  initialValues, kennelVars, manualOverride,
  onSaveAction, onSendAction, onAdvancedMode,
}: Props) {
  const t = useT()
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [tab, setTab] = useState<'form' | 'preview'>('form')

  return (
    <div className="space-y-3 min-w-0">
      {/* Tabs solo en móvil */}
      <div className="lg:hidden inline-flex rounded-lg bg-surface-soft p-0.5 border border-hairline">
        <TabBtn active={tab === 'form'} onClick={() => setTab('form')}>
          <ListChecks className="h-3.5 w-3.5 inline mr-1" />
          {t('Formulario')}
        </TabBtn>
        <TabBtn active={tab === 'preview'} onClick={() => setTab('preview')}>
          <Eye className="h-3.5 w-3.5 inline mr-1" />
          {t('Vista previa')}
        </TabBtn>
      </div>

      {/* Grid responsive sin altura forzada — cada panel scrollea hasta
          max-h-[80vh]. Antes usaba h-[calc(100vh-380px)] que cuando había
          DOS contratos apilados (reserva + entrega) tiraba la altura
          de la 2ª caja fuera de la ventana. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 lg:gap-5 min-w-0">
        {/* Izquierda — Formulario */}
        <div className={`min-w-0 ${tab === 'form' ? 'block' : 'hidden lg:block'}`}>
          <div className="lg:max-h-[80vh] lg:overflow-hidden flex flex-col rounded-2xl border border-hairline bg-canvas">
            <ContractFillForm
              reservationId={reservationId}
              contractId={contractId}
              kind={kind}
              initialValues={initialValues}
              manualOverride={manualOverride}
              onValuesChange={setValues}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onSaveAction={onSaveAction as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onSendAction={onSendAction as any}
              onAdvancedMode={onAdvancedMode}
            />
          </div>
        </div>

        {/* Derecha — Preview */}
        <div className={`min-w-0 ${tab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <div className="lg:max-h-[80vh] lg:overflow-hidden flex flex-col rounded-2xl border border-hairline bg-canvas">
            <ContractLivePreview
              templateBody={templateBody}
              values={values}
              kennelVars={kennelVars}
              title={contractTitle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-md text-[12.5px] font-semibold transition-colors ${
        active ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
