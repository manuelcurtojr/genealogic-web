/**
 * Contrato de una reserva — lado criador.
 *
 * Estados:
 *  - Sin contrato: muestra picker de plantilla → "Crear contrato"
 *  - draft: editor activo + botón "Enviar al cliente"
 *  - sent: vista preview + "Firmar como criador" + "Cancelar"
 *  - signed_partial: ídem + estado de firma de la otra parte
 *  - signed_full: lectura + descarga PDF (TODO)
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getContractByReservation } from '@/lib/contracts/contracts'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { CONTRACT_TEMPLATES } from '@/lib/contracts/templates'
import ContractEditor from '@/components/contracts/contract-editor'
import {
  createOrInitContractAction,
  createFromUserTemplateAction,
  saveContractDraftAction,
  sendContractAction,
  signContractAsBreederAction,
  cancelContractAction,
} from './actions'
import { listContractTemplatesForUser } from '@/lib/contracts/templates-actions'
import { CheckCircle2, FileText, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contrato · Genealogic' }

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
    .select('id, kennel_id, applicant_name, kennel:kennels(owner_id, name)')
    .eq('id', id)
    .maybeSingle()
  if (!reservation) notFound()
  if (reservation.kennel?.owner_id !== user.id) redirect('/reservas')

  // Contratos + firma electrónica básica están incluidos desde Kennel Free
  // (marca FPE en /pricing). El acceso se restringe por propiedad de la
  // reserva (check de arriba), no por plan.
  const contract = await getContractByReservation(reservation.id)

  return (
    <div>
      <Link
        href={`/reservas/${reservation.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← {reservation.applicant_name}
      </Link>

      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Contrato</h1>
        {contract && <StatusBadge status={contract.status} />}
      </div>

      {!contract ? (
        <CreateContractCard
          reservationId={reservation.id}
          userTemplates={await listContractTemplatesForUser()}
        />
      ) : contract.status === 'draft' ? (
        <ContractEditor
          reservationId={reservation.id}
          contractId={contract.id}
          initialBody={contract.body_html}
          initialTitle={contract.title}
          canSend
          onSaveAction={saveContractDraftAction}
          onSendAction={sendContractAction}
        />
      ) : (
        <SentOrSignedView reservation={reservation} contract={contract} />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const meta: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
    sent: { label: 'Enviado al cliente', color: 'bg-blue-50 text-blue-800' },
    signed_partial: { label: 'Firmado parcial', color: 'bg-amber-50 text-amber-800' },
    signed_full: { label: '✓ Firmado por ambas partes', color: 'bg-emerald-50 text-emerald-800' },
    cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-700' },
  }
  const m = meta[status] ?? meta.draft
  return (
    <span
      className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${m.color}`}
    >
      {m.label}
    </span>
  )
}

function CreateContractCard({
  reservationId,
  userTemplates,
}: {
  reservationId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userTemplates: any[]
}) {
  // Plantilla por defecto del kennel (si la marcó como default en /contratos)
  // sale destacada como CTA principal.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultTpl = userTemplates.find((t: any) => t.is_default) || null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const otherUserTpls = userTemplates.filter((t: any) => !t.is_default)
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-8">
      <div className="flex items-center gap-3 mb-3">
        <FileText className="h-6 w-6 text-ink" />
        <p className="text-lg font-bold text-ink">Crea el contrato</p>
      </div>
      <p className="text-sm text-body mb-6 max-w-2xl">
        Elige una plantilla. Se pre-rellena con los datos de la reserva (cliente, cachorro,
        precio). Después la editas con markdown ligero (negrita, listas, separadores) y la
        envías al cliente para firma.
      </p>

      {/* Plantillas del propio criador (contract_templates) */}
      {userTemplates.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Tus plantillas
          </p>
          <div className="flex flex-wrap gap-2">
            {defaultTpl && (
              <form
                action={async () => {
                  'use server'
                  await createFromUserTemplateAction(reservationId, defaultTpl.id)
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90"
                >
                  ★ {defaultTpl.name} <span className="text-[10px] opacity-75">(por defecto)</span>
                </button>
              </form>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {otherUserTpls.map((tpl: any) => (
              <form
                key={tpl.id}
                action={async () => {
                  'use server'
                  await createFromUserTemplateAction(reservationId, tpl.id)
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-hairline bg-canvas text-ink px-4 py-2 text-sm font-semibold hover:border-ink/30 transition"
                >
                  {tpl.name}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {/* Plantillas base (hardcoded) — fallback siempre disponible */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          {userTemplates.length > 0 ? 'O empieza desde modelo base' : 'Modelos base'}
        </p>
        <div className="flex flex-wrap gap-2">
          {CONTRACT_TEMPLATES.map((tpl) => (
            <form
              key={tpl.id}
              action={async () => {
                'use server'
                await createOrInitContractAction(reservationId, tpl.id)
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-hairline bg-canvas text-ink px-4 py-2 text-sm font-semibold hover:border-ink/30 transition"
              >
                Usar: {tpl.label}
              </button>
            </form>
          ))}
        </div>
      </div>

      <p className="mt-6 text-[12px] text-muted">
        ¿Quieres crear tu propia plantilla? Ve a{' '}
        <a href="/contratos" className="text-ink underline">Contratos</a> y guarda tus modelos
        para reusarlos en cada reserva.
      </p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SentOrSignedView({ reservation, contract }: { reservation: any; contract: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <article
        className="contract-preview rounded-2xl border border-hairline bg-canvas p-8"
        dangerouslySetInnerHTML={{ __html: renderContractMarkdown(contract.body_html) }}
      />
      <aside className="space-y-4">
        <SignaturePanel reservation={reservation} contract={contract} />
        <ContractActionsPanel reservation={reservation} contract={contract} />
      </aside>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SignaturePanel({ reservation, contract }: { reservation: any; contract: any }) {
  return (
    <section className="rounded-2xl border border-hairline bg-canvas p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">Firmas</h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Criador</p>
          {contract.signed_at_breeder ? (
            <p className="font-semibold text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {contract.signature_breeder_name}
            </p>
          ) : (
            <SignAsBreederForm
              reservationId={reservation.id}
              contractId={contract.id}
            />
          )}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Cliente</p>
          {contract.signed_at_client ? (
            <p className="font-semibold text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {contract.signature_client_name}
            </p>
          ) : (
            <p className="text-xs text-muted">Pendiente de firma del cliente</p>
          )}
        </div>
      </div>
    </section>
  )
}

function SignAsBreederForm({
  reservationId,
  contractId,
}: {
  reservationId: string
  contractId: string
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
        placeholder="Tu nombre completo"
        className="w-full rounded-md border border-hairline bg-surface-card px-2.5 py-1.5 text-xs text-ink"
      />
      <button
        type="submit"
        className="w-full rounded-md bg-ink text-on-primary px-3 py-1.5 text-xs font-semibold hover:opacity-90"
      >
        Firmar como criador
      </button>
    </form>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ContractActionsPanel({ reservation, contract }: { reservation: any; contract: any }) {
  return (
    <section className="rounded-2xl border border-hairline bg-canvas p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">Acciones</h3>
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
            Volver a borrador (reset firmas)
          </button>
        </form>
      )}
      <p className="mt-3 text-[11px] text-muted leading-relaxed">
        El contrato es visible para el cliente desde su panel{' '}
        <code>/mis-reservas/{reservation.id.slice(0, 6)}…/contrato</code>. Cancelar lo
        devuelve a borrador y borra ambas firmas.
      </p>
    </section>
  )
}
