'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Loader2, Crown, Mail, Phone, Inbox, ShoppingCart, Users2, Sparkles, Filter,
} from 'lucide-react'
import ReservationDetailPanel, { type Reservation as FullReservation, type DogOption } from './reservation-detail-panel'

type Status =
  | 'interested' | 'waitlisted' | 'deposit_paid'
  | 'assigned' | 'contract_signed' | 'paid_in_full' | 'delivered' | 'cancelled'
  | 'refunded' | 'lost'

const VENTAS_STATUSES: Status[] = ['interested', 'waitlisted', 'deposit_paid']
const CLIENTES_STATUSES: Status[] = ['assigned', 'contract_signed', 'paid_in_full', 'delivered', 'cancelled', 'refunded']

const STATUS_LABEL: Record<Status, string> = {
  interested: 'Interesado',
  waitlisted: 'Lista de espera',
  deposit_paid: 'Seña pagada',
  assigned: 'Asignado',
  contract_signed: 'Contrato firmado',
  paid_in_full: 'Pagado completo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  lost: 'Perdido',
}

const STATUS_TONE: Record<Status, string> = {
  interested: 'bg-slate-100 text-slate-700',
  waitlisted: 'bg-amber-100 text-amber-800',
  deposit_paid: 'bg-blue-100 text-blue-800',
  assigned: 'bg-violet-100 text-violet-800',
  contract_signed: 'bg-indigo-100 text-indigo-800',
  paid_in_full: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
  refunded: 'bg-rose-100 text-rose-800',
  lost: 'bg-stone-200 text-stone-700',
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual',
  public_form: 'Web pública',
  emailbot: 'Emailbot',
  api: 'API',
}

type Reservation = FullReservation

interface Props {
  kennelId: string
  kennelName: string
  reservations: Reservation[]
  dogs: DogOption[]
  isPro: boolean
}

type Pipeline = 'ventas' | 'clientes'

export default function ReservationsPipeline({ kennelId, kennelName, reservations: initialReservations, dogs, isPro }: Props) {
  const router = useRouter()
  const [reservations, setReservations] = useState(initialReservations)
  const [pipeline, setPipeline] = useState<Pipeline>('ventas')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Counts por estado (sobre todo el dataset)
  const counts = useMemo(() => {
    const out: Partial<Record<Status, number>> = {}
    for (const r of reservations) out[r.status] = (out[r.status] || 0) + 1
    return out
  }, [reservations])

  const totalVentas = VENTAS_STATUSES.reduce((acc, s) => acc + (counts[s] || 0), 0)
  const totalClientes = CLIENTES_STATUSES.reduce((acc, s) => acc + (counts[s] || 0), 0)

  // Filtrado: en Free solo se muestra "Todas" cronológico
  // En Pro: pipeline activo + status filter
  const filtered = useMemo(() => {
    if (!isPro) return reservations
    const pipelineStatuses = pipeline === 'ventas' ? VENTAS_STATUSES : CLIENTES_STATUSES
    let list = reservations.filter((r) => (pipelineStatuses as string[]).includes(r.status))
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
    return list
  }, [reservations, pipeline, statusFilter, isPro])

  const totalPipeline = pipeline === 'ventas' ? totalVentas : totalClientes
  const pipelineTabs = pipeline === 'ventas' ? VENTAS_STATUSES : CLIENTES_STATUSES

  const handleStatusChange = async (id: string, newStatus: Status) => {
    const before = reservations
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
    const supabase = createClient()
    const { error } = await supabase
      .from('puppy_reservations')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setReservations(before)
      console.error('status change error', error)
    } else {
      router.refresh()
    }
  }

  const selected = selectedId ? reservations.find((r) => r.id === selectedId) : null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
          {isPro ? 'Pipeline' : 'Bandeja'}
        </p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {isPro ? (pipeline === 'ventas' ? 'Ventas' : 'Clientes') : 'Solicitudes'}
        </h1>
        <p className="mt-2 text-[14px] text-body">
          {isPro
            ? pipeline === 'ventas'
              ? `${totalVentas} ${totalVentas === 1 ? 'lead' : 'leads'} en pipeline · ${kennelName}`
              : `${totalClientes} ${totalClientes === 1 ? 'cliente reservado' : 'clientes reservados'} · ${kennelName}`
            : `${reservations.length} ${reservations.length === 1 ? 'solicitud recibida' : 'solicitudes recibidas'} · ${kennelName}`}
        </p>
      </div>

      {/* Switcher Ventas/Clientes — solo Pro */}
      {isPro && (
        <div className="inline-flex rounded-xl border border-hairline bg-canvas p-1">
          <button
            onClick={() => { setPipeline('ventas'); setStatusFilter('all') }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors ${
              pipeline === 'ventas' ? 'bg-ink text-on-primary' : 'text-body hover:bg-surface-soft'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Ventas
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${pipeline === 'ventas' ? 'bg-white/20 text-on-primary' : 'bg-surface-card text-muted'}`}>{totalVentas}</span>
          </button>
          <button
            onClick={() => { setPipeline('clientes'); setStatusFilter('all') }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors ${
              pipeline === 'clientes' ? 'bg-ink text-on-primary' : 'text-body hover:bg-surface-soft'
            }`}
          >
            <Users2 className="h-3.5 w-3.5" />
            Clientes
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${pipeline === 'clientes' ? 'bg-white/20 text-on-primary' : 'bg-surface-card text-muted'}`}>{totalClientes}</span>
          </button>
        </div>
      )}

      {/* Free upgrade hint */}
      {!isPro && (
        <div className="flex items-start gap-2.5 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3">
          <Crown className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-purple-900">
              Pipeline completo de Ventas + Clientes con Pro
            </p>
            <p className="mt-0.5 text-[12.5px] text-purple-800">
              Gestiona depósitos, contratos, asignación a cachorros y emailbot automático.{' '}
              <Link href="/cuenta/suscripcion" className="font-semibold underline">
                Ver planes →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Tabs por estado — solo Pro */}
      {isPro && (
        <div className="flex flex-wrap gap-2 border-b border-hairline pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[12.5px] font-medium transition ${
              statusFilter === 'all' ? 'bg-ink text-on-primary' : 'text-body hover:bg-surface-soft'
            }`}
          >
            Todas
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusFilter === 'all' ? 'bg-white/20 text-on-primary' : 'bg-surface-card text-muted'}`}>
              {totalPipeline}
            </span>
          </button>
          {pipelineTabs.map((s) => {
            const isActive = statusFilter === s
            const count = counts[s] || 0
            if (count === 0) return null
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[12.5px] font-medium transition ${
                  isActive ? 'bg-ink text-on-primary' : 'text-body hover:bg-surface-soft'
                }`}
              >
                {STATUS_LABEL[s]}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-white/20 text-on-primary' : 'bg-surface-card text-muted'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-[14px] text-body">No hay solicitudes que mostrar.</p>
          <p className="mt-1 text-[12.5px] text-muted">
            Cuando alguien envíe el formulario "Solicitudes" desde tu perfil público, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
          <table className="w-full text-[13.5px]">
            <thead className="bg-surface-soft text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Solicitante</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-left font-semibold">Preferencia</th>
                <th className="px-4 py-3 text-left font-semibold">Origen</th>
                <th className="px-4 py-3 text-right font-semibold">Recibida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {filtered.map((r) => {
                const isSelected = selectedId === r.id
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`cursor-pointer transition-colors hover:bg-surface-soft ${isSelected ? 'bg-surface-soft' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{r.applicant_name || '—'}</p>
                      {r.applicant_email && (
                        <p className="text-[12px] text-muted truncate">{r.applicant_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(r.id, e.target.value as Status)}
                        className={`rounded-md px-2 py-1 text-[11.5px] font-medium border-0 cursor-pointer ${STATUS_TONE[r.status]}`}
                      >
                        {[...VENTAS_STATUSES, ...CLIENTES_STATUSES].map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {[
                        r.preference_sex === 'male' ? 'Macho' : r.preference_sex === 'female' ? 'Hembra' : null,
                        r.preference_color,
                      ].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-surface-card px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-muted">
                        {r.source === 'public_form' && <Sparkles className="h-2.5 w-2.5" />}
                        {SOURCE_LABEL[r.source || 'manual'] || 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[12.5px] text-muted tabular-nums">
                      {new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Side panel detalle con 3 tabs (Acciones / Cliente / Conversación) */}
      {selected && (
        <ReservationDetailPanel
          reservation={selected}
          dogs={dogs}
          isPro={isPro}
          onClose={() => setSelectedId(null)}
          onChanged={() => router.refresh()}
        />
      )}
    </div>
  )
}
