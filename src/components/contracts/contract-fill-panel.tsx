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

export interface BreedOption {
  id: string
  name: string
  colors: { id: string; name: string; hex_code?: string | null }[]
}

export interface KennelDogOption {
  id: string
  name: string
  sex: 'male' | 'female' | null
  microchip: string | null
  registration: string | null
  birthDate: string | null
  thumbnailUrl: string | null
  breedName: string | null
  colorName: string | null
}

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
  /** Catálogo de razas + sus colores, cargado server-side. Alimenta el
   *  selector de raza (typeahead) y el multi-select de colores. */
  breedOptions: BreedOption[]
  /** Perros del criadero (max 500) — selector del cachorro asignado. */
  kennelDogs: KennelDogOption[]
  /** UUID del perro actualmente asignado a la reserva (puppy_reservations.dog_id),
   *  o null si todavía no se ha asignado un ejemplar concreto. */
  assignedDogId: string | null
  /** Si true, formulario disabled (el criador editó markdown a mano). */
  manualOverride: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSaveAction: (...args: any[]) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSendAction: (...args: any[]) => Promise<any>
  /** Server action que asigna/desasigna perro a la reserva. */
  onAssignDogAction: (
    reservationId: string,
    dogId: string | null,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onAdvancedMode: () => void
}

export default function ContractFillPanel({
  reservationId, contractId, kind, templateBody, contractTitle,
  initialValues, kennelVars, breedOptions, kennelDogs, assignedDogId,
  manualOverride,
  onSaveAction, onSendAction, onAssignDogAction, onAdvancedMode,
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

      {/* Grid responsive — cada panel tiene altura fija de viewport con
          scroll interno. Patrón clave para evitar "contenido cortado":
            - lg:h-[calc(100vh-220px)] da una altura concreta (no max-h)
            - lg:overflow-y-auto en cada cell hace el scroll
            - el sticky header del form/preview se queda anclado arriba
              porque su scroll context es esta cell.
          En móvil cada panel crece según contenido (sin scroll interno,
          el scroll natural de la página lo gestiona). */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 lg:gap-5 min-w-0 lg:h-[calc(100vh-220px)] lg:min-h-[600px]">
        {/* Izquierda — Formulario */}
        <div className={`min-w-0 rounded-2xl border border-hairline bg-canvas lg:overflow-y-auto ${
          tab === 'form' ? 'block' : 'hidden lg:block'
        }`}>
          <ContractFillForm
            reservationId={reservationId}
            contractId={contractId}
            kind={kind}
            initialValues={initialValues}
            breedOptions={breedOptions}
            kennelDogs={kennelDogs}
            assignedDogId={assignedDogId}
            manualOverride={manualOverride}
            onValuesChange={setValues}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSaveAction={onSaveAction as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSendAction={onSendAction as any}
            onAssignDogAction={onAssignDogAction}
            onAdvancedMode={onAdvancedMode}
          />
        </div>

        {/* Derecha — Preview */}
        <div className={`min-w-0 rounded-2xl border border-hairline bg-canvas lg:overflow-y-auto ${
          tab === 'preview' ? 'block' : 'hidden lg:block'
        }`}>
          <ContractLivePreview
            templateBody={templateBody}
            values={values}
            kennelVars={kennelVars}
            title={contractTitle}
          />
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
