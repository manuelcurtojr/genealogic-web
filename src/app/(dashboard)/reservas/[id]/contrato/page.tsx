/**
 * Contratos de una reserva — lado criador.
 *
 * Gestiona DOS contratos por reserva, cada uno con su propio flujo:
 *  - kind 'reservation' → Contrato de reserva
 *  - kind 'delivery'    → Contrato de compraventa y entrega
 *
 * Por cada bloque (kind):
 *  - Sin contrato: picker de plantilla → "Crear contrato de reserva/entrega"
 *  - draft: editor activo + botón "Enviar al cliente"
 *  - sent: vista preview + "Firmar como criador" + "Cancelar"
 *  - signed_partial: ídem + estado de firma de la otra parte
 *  - signed_full: lectura + descarga PDF (TODO)
 *
 * El orden de los bloques se adapta a la etapa del embudo: si la reserva está
 * en una etapa de entrega ('Pendiente de entrega' / 'Entregado') el bloque de
 * entrega sale primero y abierto; si no, manda el de reserva.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getContractsByReservation, type ReservationContract } from '@/lib/contracts/contracts'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { CONTRACT_TEMPLATES, type ContractKind, getTokenizedBaseTemplate } from '@/lib/contracts/templates'
import { buildContractVars } from '@/lib/contracts/render'
import ContractEditor from '@/components/contracts/contract-editor'
import ContractFillPanel, { type BreedOption } from '@/components/contracts/contract-fill-panel'
import {
  createOrInitContractAction,
  createFromUserTemplateAction,
  saveContractDraftAction,
  saveContractValuesAction,
  setAdvancedModeAction,
  sendContractAction,
  signContractAsBreederAction,
  cancelContractAction,
} from './actions'
import { listContractTemplatesForUser, type ContractTemplate } from '@/lib/contracts/templates-actions'
import { CheckCircle2, FileText, AlertCircle, AlertTriangle } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

type T = (k: string) => string

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contratos · Genealogic' }

// Etapas del embudo que indican que la reserva ya está en fase de entrega.
const DELIVERY_STAGES = new Set(['Pendiente de entrega', 'Entregado'])

/**
 * Carga el catálogo completo de razas + sus colores admitidos.
 *
 * Es UNA query con join lateral via breed_colors → colors. Como hay ~246
 * razas y ~80 colores, el dataset es pequeño (< 100 KB) y se puede cachear
 * en memoria perfectamente. Aún así lo dejamos sin cache explícita: el
 * server component se ejecuta una vez por request y Next.js ya lo hace
 * de su cuenta en producción.
 */
async function loadBreedOptions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
): Promise<BreedOption[]> {
  // Cargar las dos tablas y la pivote por separado — joins de Supabase
  // pueden hacer cosas raras si el tamaño es grande. Three queries en
  // paralelo, mismo orden de magnitud que un single join.
  const [breedsRes, colorsRes, pivotRes] = await Promise.all([
    admin.from('breeds').select('id, name').order('name'),
    admin.from('colors').select('id, name, hex_code'),
    admin.from('breed_colors').select('breed_id, color_id'),
  ])
  const colorById = new Map<string, { id: string; name: string; hex_code: string | null }>()
  for (const c of (colorsRes.data || []) as Array<{ id: string; name: string; hex_code: string | null }>) {
    colorById.set(c.id, c)
  }
  const colorsByBreed = new Map<string, BreedOption['colors']>()
  for (const row of (pivotRes.data || []) as Array<{ breed_id: string; color_id: string }>) {
    const c = colorById.get(row.color_id)
    if (!c) continue
    const arr = colorsByBreed.get(row.breed_id) || []
    arr.push({ id: c.id, name: c.name, hex_code: c.hex_code })
    colorsByBreed.set(row.breed_id, arr)
  }
  return ((breedsRes.data || []) as Array<{ id: string; name: string }>).map((b) => ({
    id: b.id,
    name: b.name,
    colors: (colorsByBreed.get(b.id) || []).sort((a, z) => a.name.localeCompare(z.name)),
  }))
}

export default async function BreederContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: reservation } = await admin
    .from('puppy_reservations')
    .select(`
      id, kennel_id, applicant_name, stage_id,
      kennel:kennels(
        owner_id, name,
        legal_name, legal_id, legal_address,
        legal_representative, legal_representative_id,
        sign_city, jurisdiction
      ),
      stage:pipeline_stages(name)
    `)
    .eq('id', id)
    .maybeSingle()
  if (!reservation) notFound()
  if (reservation.kennel?.owner_id !== user.id) redirect('/reservas')

  // ─── Gate de datos legales ────────────────────────────────────────────
  // Sin los datos legales del criadero, los contratos se generan con
  // razón social, CIF, domicilio, representante, etc. en blanco
  // (`__________________`). Eso pasa siempre que un kennel acaba de crearse.
  // Mejor avisarlo en banner ANTES de que genere 50 contratos vacíos. Los
  // 4 campos obligatorios son los mínimos para que un contrato sea válido
  // legalmente — los otros 3 (sign_city, jurisdiction, representative_id)
  // son recomendados pero no bloqueantes.
  const k = reservation.kennel as Record<string, string | null> | null
  const missingLegalFields: string[] = []
  if (!k?.legal_name) missingLegalFields.push('Razón social')
  if (!k?.legal_id) missingLegalFields.push('NIF/CIF')
  if (!k?.legal_address) missingLegalFields.push('Domicilio')
  if (!k?.legal_representative) missingLegalFields.push('Representante legal')
  const legalDataMissing = missingLegalFields.length > 0

  // Contratos + firma electrónica básica están incluidos desde Kennel Free
  // (marca FPE en /pricing). El acceso se restringe por propiedad de la
  // reserva (check de arriba), no por plan.
  const contracts = await getContractsByReservation(reservation.id)
  const userTemplates = await listContractTemplatesForUser()
  const t = getTranslator(await getLocale())

  // Catálogo de razas + colores para el fill-form (combobox + multi-select)
  const breedOptions = await loadBreedOptions(admin)

  const reservationContract = contracts.find((c) => c.kind === 'reservation') ?? null
  const deliveryContract = contracts.find((c) => c.kind === 'delivery') ?? null

  // Sugerencia por etapa del embudo: si la reserva ya está en una etapa de
  // entrega, resaltamos/expandimos el bloque de entrega y lo subimos arriba.
  const stageName: string | null = reservation.stage?.name ?? null
  const deliveryPhase = stageName != null && DELIVERY_STAGES.has(stageName)

  const reservationBlock = (
    <ContractBlock
      key="reservation"
      kind="reservation"
      reservation={reservation}
      contract={reservationContract}
      userTemplates={userTemplates}
      breedOptions={breedOptions}
      highlighted={!deliveryPhase}
      legalDataMissing={legalDataMissing}
      t={t}
    />
  )
  const deliveryBlock = (
    <ContractBlock
      key="delivery"
      kind="delivery"
      reservation={reservation}
      contract={deliveryContract}
      userTemplates={userTemplates}
      breedOptions={breedOptions}
      highlighted={deliveryPhase}
      legalDataMissing={legalDataMissing}
      t={t}
    />
  )

  return (
    <div>
      <Link
        href={`/reservas/${reservation.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← {reservation.applicant_name}
      </Link>

      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{t('Contratos')}</h1>
      </div>
      <p className="text-sm text-body mb-8 max-w-2xl">
        {t('Cada reserva tiene dos contratos: la reserva inicial (con señal) y la compraventa definitiva en el momento de la entrega. Gestiona cada uno por separado.')}
      </p>

      {/* ─── Gate: datos legales del criadero incompletos ─────────────────
          Aparece SOLO si faltan campos obligatorios (razón social, CIF,
          domicilio, representante). Sin ellos, los contratos se generan
          con esos huecos en blanco — válido a nivel BBDD pero no útil
          legalmente. El CTA lleva directo a /kennel/contenido/legal. */}
      {legalDataMissing && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-700 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900">
                {t('Completa tus datos legales antes de generar contratos')}
              </p>
              <p className="mt-1 text-sm text-amber-800">
                {t('Faltan campos obligatorios del criadero:')}{' '}
                <strong>{missingLegalFields.join(', ')}</strong>.{' '}
                {t('Sin ellos los contratos salen con huecos en blanco y no son válidos para presentar al cliente.')}
              </p>
              <Link
                href="/kennel/legal"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-900 text-amber-50 px-4 py-2 text-sm font-semibold hover:bg-amber-950"
              >
                {t('Completar datos legales')} →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-10">
        {deliveryPhase ? (
          <>
            {deliveryBlock}
            {reservationBlock}
          </>
        ) : (
          <>
            {reservationBlock}
            {deliveryBlock}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Un bloque por tipo de contrato. Encapsula todo el flujo (crear / editar /
 * preview+firma) scoped a un `kind` concreto.
 */
function ContractBlock({
  kind,
  reservation,
  contract,
  userTemplates,
  breedOptions,
  highlighted,
  legalDataMissing,
  t,
}: {
  kind: ContractKind
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reservation: any
  contract: ReservationContract | null
  userTemplates: ContractTemplate[]
  breedOptions: BreedOption[]
  highlighted: boolean
  legalDataMissing: boolean
  t: T
}) {
  const blockTitle = kind === 'delivery'
    ? t('Contrato de compraventa y entrega')
    : t('Contrato de reserva')

  const blockSubtitle = kind === 'delivery'
    ? t('Se firma al entregar el cachorro. Identifica al perro concreto, importes finales y garantías.')
    : t('Se firma al pagar la señal. Define raza, sexo, color y precio estimado.')

  // Cuando el contrato está en draft (fill-form), envolver con un border
  // mínimo: el split panel ya tiene sus propias tarjetas y un padding
  // adicional pesado anida cards y empeora el ancho útil. Para los otros
  // estados (sin contrato, sent, signed) mantenemos un card más cálido.
  const isDraftWithPanel = contract?.status === 'draft'
  const containerClass = isDraftWithPanel
    ? 'min-w-0'
    : `rounded-2xl border p-5 sm:p-6 min-w-0 ${
        highlighted ? 'border-ink/30 bg-surface-soft/40' : 'border-hairline bg-canvas'
      }`

  return (
    <section className={containerClass}>
      <header className="flex items-start justify-between gap-3 flex-wrap mb-5 min-w-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
            highlighted ? 'bg-ink text-on-primary' : 'bg-surface-soft text-ink border border-hairline'
          }`}>
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[17px] sm:text-[19px] font-bold tracking-tight text-ink leading-tight">{blockTitle}</h2>
            <p className="mt-0.5 text-[12.5px] text-muted leading-snug max-w-md">{blockSubtitle}</p>
          </div>
        </div>
        {contract && <StatusBadge status={contract.status} t={t} />}
      </header>

      {!contract ? (
        <CreateContractCard
          reservationId={reservation.id}
          kind={kind}
          userTemplates={userTemplates}
          locked={legalDataMissing}
          t={t}
        />
      ) : contract.status === 'draft' ? (
        <DraftContractBody
          reservation={reservation}
          contract={contract}
          breedOptions={breedOptions}
          t={t}
        />
      ) : (
        <SentOrSignedView reservation={reservation} contract={contract} t={t} />
      )}
    </section>
  )
}

/**
 * Decide qué editor montar para un contrato en estado draft:
 *
 *  - `template_values.__manual__` === true → el criador eligió "Modo
 *    avanzado", editor markdown clásico. Para volver al fill-form tiene
 *    que cancelar el contrato (que limpia el flag y vuelve a draft).
 *
 *  - resto (incluido template_values=NULL en contratos legacy) → fill-form
 *    nuevo: formulario izquierda + preview derecha, datos legales del
 *    criadero auto-rellenados. Para contratos legacy, el form arranca con
 *    los valores derivados de la reserva — body_html se regenera en cuanto
 *    el criador edita el primer campo.
 */
async function DraftContractBody({
  reservation, contract, breedOptions, t,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reservation: any
  contract: ReservationContract
  breedOptions: BreedOption[]
  t: T
}) {
  const tplValues = (contract.template_values as Record<string, unknown> | null) || null
  const manualOverride = tplValues?.__manual__ === true

  // Solo el modo avanzado explícito → markdown editor. Todo lo demás
  // (incluido contratos legacy con template_values=NULL) → fill-form.
  if (manualOverride) {
    return (
      <ContractEditor
        reservationId={reservation.id}
        contractId={contract.id}
        initialBody={contract.body_html}
        initialTitle={contract.title}
        canSend
        onSaveAction={saveContractDraftAction}
        onSendAction={sendContractAction}
      />
    )
  }

  // Caso nuevo flow → fill-form + preview
  // Resolvemos la plantilla:
  //   - Si source_template_id está, cargamos su body_md
  //   - Si no, usamos la plantilla base tokenizada del kind
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  let templateBody: string
  if (contract.source_template_id) {
    const { data: srcTpl } = await admin
      .from('contract_templates')
      .select('body_md')
      .eq('id', contract.source_template_id)
      .maybeSingle()
    templateBody = srcTpl?.body_md || getTokenizedBaseTemplate(contract.kind)
  } else {
    templateBody = getTokenizedBaseTemplate(contract.kind)
  }

  // Resolver los valores iniciales del form: kennel/lead vars + saved values
  const baseVars = buildContractVars(reservation, contract.kind)
  const initialValues: Record<string, string> = {}
  for (const [k, v] of Object.entries(baseVars)) {
    if (v != null && String(v).trim() !== '' && k !== '__manual__') {
      initialValues[k] = String(v)
    }
  }
  // Saved values en BBDD ganan sobre los derivados (lo que el criador edite
  // se persiste y mantiene al recargar).
  const saved = (tplValues as Record<string, string> | null) || {}
  for (const [k, v] of Object.entries(saved)) {
    if (k === '__manual__') continue
    if (v != null && String(v).trim() !== '') initialValues[k] = String(v)
  }

  // kennelVars: lo que NO se edita en el form pero se inyecta al preview
  const kennelVars: Record<string, string | null | undefined> = {
    legalName: baseVars.legalName,
    legalId: baseVars.legalId,
    legalAddress: baseVars.legalAddress,
    representative: baseVars.representative,
    representativeId: baseVars.representativeId,
    signCity: baseVars.signCity,
    jurisdiction: baseVars.jurisdiction,
  }

  // Server action wrapper: el cliente llama con (resId, contractId, values),
  // el server descarta __manual__ si llegara colado del cliente.
  async function handleSetAdvancedMode() {
    'use server'
    await setAdvancedModeAction(reservation.id, contract.id)
  }

  return (
    <ContractFillPanel
      reservationId={reservation.id}
      contractId={contract.id}
      kind={contract.kind}
      templateBody={templateBody}
      contractTitle={contract.title}
      initialValues={initialValues}
      kennelVars={kennelVars}
      breedOptions={breedOptions}
      manualOverride={false}
      onSaveAction={saveContractValuesAction}
      onSendAction={sendContractAction}
      onAdvancedMode={handleSetAdvancedMode}
    />
  )
}

function StatusBadge({ status, t }: { status: string; t: T }) {
  const meta: Record<string, { label: string; color: string; dot: string }> = {
    draft:          { label: 'Borrador',                color: 'bg-gray-100 text-gray-700 border-gray-200',    dot: 'bg-gray-400' },
    sent:           { label: 'Enviado al cliente',      color: 'bg-blue-50 text-blue-800 border-blue-200',     dot: 'bg-blue-500' },
    signed_partial: { label: 'Firmado parcial',         color: 'bg-amber-50 text-amber-800 border-amber-200',  dot: 'bg-amber-500' },
    signed_full:    { label: 'Firmado por ambas partes', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
    cancelled:      { label: 'Cancelado',               color: 'bg-red-50 text-red-700 border-red-200',        dot: 'bg-red-500' },
  }
  const m = meta[status] ?? meta.draft
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${m.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {t(m.label)}
    </span>
  )
}

function CreateContractCard({
  reservationId,
  kind,
  userTemplates,
  locked,
  t,
}: {
  reservationId: string
  kind: ContractKind
  userTemplates: ContractTemplate[]
  /** Si true, deshabilita los botones de "Crear contrato". El banner del
   *  gate de datos legales explica por qué arriba; aquí solo bloqueamos. */
  locked: boolean
  t: T
}) {
  // Plantilla base correspondiente a este tipo de contrato.
  const baseTpl = CONTRACT_TEMPLATES.find((ct) => ct.kind === kind) ?? CONTRACT_TEMPLATES[0]
  const createLabel = kind === 'delivery'
    ? t('Crear contrato de entrega')
    : t('Crear contrato de reserva')

  // Plantilla por defecto del kennel PARA ESTE KIND (si la marcó como default
  // en /contratos) sale destacada como alternativa. Si la default es de otro
  // kind, se lista junto a las demás sin distinción.
  const defaultTpl = userTemplates.find((tp) => tp.default_for_kind === kind) || null
  const otherUserTpls = userTemplates.filter((tp) => tp.id !== defaultTpl?.id)

  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-6 sm:p-8">
      <p className="text-sm text-body mb-6 max-w-2xl">
        {t('Se pre-rellena con los datos de la reserva (cliente, cachorro, precio). Después la editas con markdown ligero (negrita, listas, separadores) y la envías al cliente para firma.')}
      </p>

      {/* CTA principal: crear desde el modelo base de este tipo */}
      <form
        action={async () => {
          'use server'
          await createOrInitContractAction(reservationId, kind)
        }}
      >
        <button
          type="submit"
          disabled={locked}
          title={locked ? t('Completa primero tus datos legales (banner amarillo arriba)') : undefined}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
        >
          <FileText className="h-4 w-4" />
          {createLabel}
        </button>
      </form>

      {/* Plantillas del propio criador (contract_templates) */}
      {userTemplates.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {t('O empieza desde una de tus plantillas')}
          </p>
          <div className="flex flex-wrap gap-2">
            {defaultTpl && (
              <form
                action={async () => {
                  'use server'
                  await createFromUserTemplateAction(reservationId, defaultTpl.id, kind)
                }}
              >
                <button
                  type="submit"
                  disabled={locked}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas text-ink px-4 py-2 text-sm font-semibold hover:border-ink/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ★ {defaultTpl.name} <span className="text-[10px] opacity-75">{t('(por defecto)')}</span>
                </button>
              </form>
            )}
            {otherUserTpls.map((tpl) => (
              <form
                key={tpl.id}
                action={async () => {
                  'use server'
                  await createFromUserTemplateAction(reservationId, tpl.id, kind)
                }}
              >
                <button
                  type="submit"
                  disabled={locked}
                  className="rounded-lg border border-hairline bg-canvas text-ink px-4 py-2 text-sm font-semibold hover:border-ink/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {tpl.name}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-[12px] text-muted">
        {t('¿Quieres crear tu propia plantilla? Ve a')}{' '}
        <a href="/contratos" className="text-ink underline">{t('Contratos')}</a> {t('y guarda tus modelos para reusarlos en cada reserva.')}
        {' '}{t('Modelo base usado:')} <span className="text-ink">{t(baseTpl.label)}</span>.
      </p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SentOrSignedView({ reservation, contract, t }: { reservation: any; contract: ReservationContract; t: T }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
      <article
        className="contract-preview min-w-0 overflow-x-hidden break-words rounded-2xl border border-hairline bg-canvas p-5 sm:p-8"
        dangerouslySetInnerHTML={{ __html: renderContractMarkdown(contract.body_html) }}
      />
      <aside className="space-y-4">
        <SignaturePanel reservation={reservation} contract={contract} t={t} />
        <ContractActionsPanel reservation={reservation} contract={contract} t={t} />
      </aside>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SignaturePanel({ reservation, contract, t }: { reservation: any; contract: ReservationContract; t: T }) {
  return (
    <section className="rounded-2xl border border-hairline bg-canvas p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">{t('Firmas')}</h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">{t('Criador')}</p>
          {contract.signed_at_breeder ? (
            <p className="font-semibold text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {contract.signature_breeder_name}
            </p>
          ) : (
            <SignAsBreederForm
              reservationId={reservation.id}
              contractId={contract.id}
              t={t}
            />
          )}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">{t('Cliente')}</p>
          {contract.signed_at_client ? (
            <p className="font-semibold text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {contract.signature_client_name}
            </p>
          ) : (
            <p className="text-xs text-muted">{t('Pendiente de firma del cliente')}</p>
          )}
        </div>
      </div>
    </section>
  )
}

function SignAsBreederForm({
  reservationId,
  contractId,
  t,
}: {
  reservationId: string
  contractId: string
  t: T
}) {
  return (
    <form
      action={async (fd: FormData) => {
        'use server'
        const name = (fd.get('name') as string) || ''
        await signContractAsBreederAction(reservationId, contractId, name)
      }}
      className="mt-1 space-y-2"
    >
      <input
        type="text"
        name="name"
        required
        placeholder={t('Tu nombre completo')}
        className="w-full rounded-md border border-hairline bg-surface-card px-2.5 py-2 text-base sm:text-xs text-ink"
      />
      <button
        type="submit"
        className="w-full rounded-md bg-ink text-on-primary px-3 py-2 sm:py-1.5 text-sm sm:text-xs font-semibold hover:opacity-90"
      >
        {t('Firmar como criador')}
      </button>
    </form>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ContractActionsPanel({ reservation, contract, t }: { reservation: any; contract: ReservationContract; t: T }) {
  return (
    <section className="rounded-2xl border border-hairline bg-canvas p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">{t('Acciones')}</h3>
      <a
        href={`/contrato-print/${contract.id}`}
        target="_blank"
        rel="noreferrer"
        className="mb-2 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
      >
        <FileText className="h-3.5 w-3.5" />
        {t('Imprimir / Guardar PDF')}
      </a>
      {contract.status !== 'signed_full' && (
        <form
          action={async () => {
            'use server'
            await cancelContractAction(reservation.id, contract.id)
          }}
        >
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-body hover:border-red-300 hover:text-red-600"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {t('Volver a borrador (reset firmas)')}
          </button>
        </form>
      )}
      <p className="mt-3 text-[11px] text-muted leading-relaxed break-words">
        {t('El contrato es visible para el cliente desde su panel')}{' '}
        <code className="break-all">/mis-reservas/{reservation.id.slice(0, 6)}…/contrato</code>. {t('Cancelar lo devuelve a borrador y borra ambas firmas.')}
      </p>
    </section>
  )
}
