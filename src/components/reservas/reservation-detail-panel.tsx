'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  X, Loader2, Check, Mail, Phone, MapPin, FileText, Crown,
  ExternalLink, AlertCircle, Trash2, Bot, MessageSquare, Send,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

// ─── Tipos compartidos ───────────────────────────────────────────────

export type Status =
  | 'interested' | 'waitlisted' | 'deposit_paid'
  | 'assigned' | 'contract_signed' | 'paid_in_full' | 'delivered'
  | 'cancelled' | 'refunded' | 'lost'

export interface Reservation {
  id: string
  status: Status
  source: string | null
  // Solicitante
  applicant_name: string | null
  applicant_email: string | null
  applicant_phone: string | null
  applicant_message: string | null
  applicant_purpose: string | null
  applicant_country: string | null
  applicant_address: string | null
  applicant_postal_code: string | null
  applicant_city: string | null
  applicant_id_doc_type: string | null
  applicant_id_doc_number: string | null
  // Preferencias
  preference_sex: string | null
  preference_color: string | null
  // Importes
  deposit_amount_cents: number | null
  total_price_cents: number | null
  currency: string | null
  // Asignación
  puppy_dog_id: string | null
  // Timeline
  created_at: string
  deposit_paid_at: string | null
  assigned_at: string | null
  reservation_signed_at: string | null
  contract_signed_at?: string | null
  paid_in_full_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  lost_at: string | null
  lost_reason: string | null
  lost_reason_detail: string | null
  // Contratos
  reservation_contract_url: string | null
  purchase_contract_url: string | null
  // Notas internas
  internal_notes: string | null
  // Bot
  bot_enabled: boolean
  bot_last_active_at: string | null
  escalated_at: string | null
  escalated_reason: string | null
}

export interface DogOption { id: string; name: string; sex: string | null; thumbnail_url: string | null }

interface Props {
  reservation: Reservation
  dogs: DogOption[]
  isPro: boolean
  onClose: () => void
  onChanged: () => void
}

// ─── Constantes ───────────────────────────────────────────────────────

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

const VENTAS_STATUSES: Status[] = ['interested', 'waitlisted', 'deposit_paid']
const CLIENTES_STATUSES: Status[] = ['assigned', 'contract_signed', 'paid_in_full', 'delivered', 'cancelled', 'refunded']

const PURPOSE_LABEL: Record<string, string> = {
  family: 'Compañía familiar',
  guard_defense: 'Guarda y defensa',
  intensive_work: 'Trabajo intensivo',
  breeding: 'Cría',
  show: 'Exposición / show',
}

const LOST_REASONS: { value: string; label: string }[] = [
  { value: 'price_too_high', label: 'Precio le pareció alto' },
  { value: 'changed_mind', label: 'Cambió de opinión' },
  { value: 'chose_another_breed', label: 'Eligió otra raza' },
  { value: 'chose_another_breeder', label: 'Eligió otro criadero' },
  { value: 'ghosted', label: 'No respondió más' },
  { value: 'life_circumstances', label: 'Cambio de circunstancias' },
  { value: 'not_qualified', label: 'No cumple requisitos' },
  { value: 'duplicate', label: 'Duplicado' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Otro' },
]

// ─── Helpers ──────────────────────────────────────────────────────────

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function money(cents: number | null | undefined, currency = 'EUR'): string {
  if (cents == null || cents === 0) return '—'
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency
  return `${(cents / 100).toLocaleString('es-ES')} ${symbol}`
}

// ─── Componente principal ────────────────────────────────────────────

type TabKey = 'acciones' | 'cliente' | 'conversacion'

export default function ReservationDetailPanel({ reservation: r, dogs, isPro, onClose, onChanged }: Props) {
  const t = useT()
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('acciones')

  const assignedDog = r.puppy_dog_id ? dogs.find((d) => d.id === r.puppy_dog_id) : null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-canvas shadow-xl"
        style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-hairline px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE[r.status]}`}>
                  {t(STATUS_LABEL[r.status])}
                </span>
                {r.escalated_at && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                    ⚠ {t('Escalada')}
                  </span>
                )}
                {!r.escalated_at && r.bot_enabled && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-800">
                    <Bot className="h-2.5 w-2.5" /> {t('Bot activo')}
                  </span>
                )}
              </div>
              <h2 className="mt-2.5 text-[20px] font-semibold tracking-[-0.02em] text-ink truncate">
                {r.applicant_name || '—'}
              </h2>
              <p className="mt-1 text-[12px] text-muted truncate">
                {r.applicant_email}
                {r.applicant_phone && ` · ${r.applicant_phone}`}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {t('Recibida')} {fmtDateTime(r.created_at)}
                {r.bot_last_active_at && <> · {t('bot activo')} {fmtDateTime(r.bot_last_active_at)}</>}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted hover:bg-surface-soft hover:text-ink"
              aria-label={t('Cerrar')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs nav */}
        <div className="border-b border-hairline">
          <nav className="-mb-px flex gap-1 px-5">
            <TabButton label={t('Acciones')} active={tab === 'acciones'} onClick={() => setTab('acciones')} />
            <TabButton label={t('Cliente')} active={tab === 'cliente'} onClick={() => setTab('cliente')} />
            <TabButton
              label={t('Conversación')}
              active={tab === 'conversacion'}
              onClick={() => setTab('conversacion')}
            />
          </nav>
        </div>

        {/* Tab content */}
        <div className="px-5 py-4">
          {tab === 'acciones' && (
            <AccionesTab
              r={r}
              dogs={dogs}
              assignedDog={assignedDog}
              isPro={isPro}
              onChanged={onChanged}
            />
          )}
          {tab === 'cliente' && <ClienteTab r={r} />}
          {tab === 'conversacion' && <ConversacionTab r={r} isPro={isPro} />}
        </div>
      </div>
    </div>
  )
}

// ============ TAB 1 — Acciones ============

function AccionesTab({
  r, dogs, assignedDog, isPro, onChanged,
}: {
  r: Reservation
  dogs: DogOption[]
  assignedDog: DogOption | null | undefined
  isPro: boolean
  onChanged: () => void
}) {
  const t = useT()
  const router = useRouter()
  const [status, setStatus] = useState<Status>(r.status)
  const [notes, setNotes] = useState(r.internal_notes || '')
  const [savedNotes, setSavedNotes] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [lostOpen, setLostOpen] = useState(false)
  const [lostReason, setLostReason] = useState('price_too_high')
  const [lostDetail, setLostDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: Status) => {
    setError(null); setLoading(true)
    const supabase = createClient()
    // Si pasamos a un estado con hito, registramos timestamp
    const patch: any = { status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'deposit_paid' && !r.deposit_paid_at) patch.deposit_paid_at = new Date().toISOString()
    if (newStatus === 'assigned' && !r.assigned_at) patch.assigned_at = new Date().toISOString()
    if (newStatus === 'contract_signed' && !r.reservation_signed_at) patch.reservation_signed_at = new Date().toISOString()
    if (newStatus === 'paid_in_full' && !r.paid_in_full_at) patch.paid_in_full_at = new Date().toISOString()
    if (newStatus === 'delivered' && !r.delivered_at) patch.delivered_at = new Date().toISOString()
    if (newStatus === 'cancelled' && !r.cancelled_at) patch.cancelled_at = new Date().toISOString()

    const { error: err } = await supabase.from('puppy_reservations').update(patch).eq('id', r.id)
    setLoading(false)
    if (err) { setError(err.message); setStatus(r.status); return }
    setStatus(newStatus)
    onChanged()
    router.refresh()
  }

  const saveNotes = async () => {
    setError(null); setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('puppy_reservations').update({ internal_notes: notes }).eq('id', r.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    setSavedNotes(true); setTimeout(() => setSavedNotes(false), 2000)
    onChanged()
  }

  const handleUnassign = async () => {
    if (!confirm(t('¿Quitar el cachorro asignado?'))) return
    setError(null); setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('puppy_reservations').update({ puppy_dog_id: null, assigned_at: null }).eq('id', r.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    onChanged(); router.refresh()
  }

  const handleMarkLost = async () => {
    setError(null); setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('puppy_reservations').update({
      status: 'lost',
      lost_at: new Date().toISOString(),
      lost_reason: lostReason,
      lost_reason_detail: lostDetail.trim() || null,
    }).eq('id', r.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    setLostOpen(false); setLostDetail(''); setStatus('lost')
    onChanged(); router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Banner de pérdida si aplica */}
      {r.status === 'lost' && (
        <div className="rounded-xl border border-stone-300 bg-stone-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">{t('Reserva perdida')}</p>
          <p className="mt-1 text-[13px] font-medium text-ink">
            {(() => { const m = LOST_REASONS.find((x) => x.value === r.lost_reason); return m ? t(m.label) : (r.lost_reason || t('Sin razón')) })()}
          </p>
          {r.lost_reason_detail && <p className="mt-1 text-[12.5px] text-body">{r.lost_reason_detail}</p>}
          {r.lost_at && <p className="mt-1 font-mono text-[10.5px] text-muted">{fmtDateTime(r.lost_at)}</p>}
        </div>
      )}

      {/* Bloque de acciones */}
      <div className="space-y-4 rounded-2xl border border-hairline bg-surface-soft p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Acciones')}</p>

        {/* Cambiar estado */}
        <div>
          <label className="block text-[12px] text-body mb-1">{t('Cambiar estado')}</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
            disabled={loading}
            className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13.5px] text-ink focus:border-ink focus:outline-none"
          >
            <optgroup label={t('Ventas')}>
              {VENTAS_STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}
            </optgroup>
            <optgroup label={t('Clientes')}>
              {CLIENTES_STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}
            </optgroup>
            <optgroup label={t('Terminales')}>
              <option value="lost">{t('Perdido')}</option>
            </optgroup>
          </select>
        </div>

        {/* Asignar/desasignar cachorro */}
        <div className="flex gap-2">
          <button
            onClick={() => setAssignOpen(true)}
            disabled={loading}
            className="flex-1 rounded-lg bg-ink px-3 py-2 text-[12.5px] font-medium text-on-primary hover:opacity-90 disabled:opacity-40"
          >
            {assignedDog ? t('Cambiar cachorro') : t('+ Asignar cachorro')}
          </button>
          {assignedDog && (
            <button
              onClick={handleUnassign}
              disabled={loading}
              className="rounded-lg border border-rose-300 px-3 py-2 text-[12.5px] font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Marcar como perdido */}
        {status !== 'lost' && !lostOpen && (
          <button
            onClick={() => setLostOpen(true)}
            className="w-full rounded-lg border border-hairline px-3 py-2 text-[12px] font-medium text-muted hover:bg-canvas hover:text-ink"
          >
            ✕ {t('Marcar como perdido')}
          </button>
        )}
        {lostOpen && (
          <div className="space-y-2 rounded-xl border border-hairline bg-canvas p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Marcar como perdido')}</p>
            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-canvas px-2.5 py-1.5 text-[12.5px] text-ink focus:border-ink focus:outline-none"
            >
              {LOST_REASONS.map((opt) => <option key={opt.value} value={opt.value}>{t(opt.label)}</option>)}
            </select>
            <textarea
              value={lostDetail}
              onChange={(e) => setLostDetail(e.target.value)}
              rows={2}
              placeholder={t('Detalle opcional')}
              className="w-full rounded-lg border border-hairline bg-canvas px-2.5 py-1.5 text-[12.5px] text-ink focus:border-ink focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleMarkLost}
                disabled={loading}
                className="rounded-lg bg-ink px-3 py-1.5 text-[12px] font-medium text-on-primary hover:opacity-90 disabled:opacity-40"
              >
                {loading ? t('Guardando…') : t('Confirmar pérdida')}
              </button>
              <button
                onClick={() => { setLostOpen(false); setLostDetail('') }}
                className="rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-medium text-body hover:bg-surface-soft"
              >
                {t('Cancelar')}
              </button>
            </div>
          </div>
        )}

        {/* Notas internas */}
        <div>
          <label className="block text-[12px] text-body mb-1">{t('Notas internas (privadas)')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('Apuntes para el equipo: llamar el viernes, prefirió cachorra atigrada…')}
            className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13.5px] text-ink focus:border-ink focus:outline-none resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-muted">
              {savedNotes && <span className="text-emerald-600">✓ {t('Guardadas')}</span>}
            </p>
            <button
              onClick={saveNotes}
              disabled={loading || notes === (r.internal_notes || '')}
              className="rounded-lg border border-hairline bg-canvas px-3 py-1 text-[11.5px] font-medium text-body hover:bg-surface-card disabled:opacity-40"
            >
              {t('Guardar notas')}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">
            {error}
          </div>
        )}
      </div>

      {/* Cachorro asignado */}
      <Section title={t('Cachorro')}>
        {assignedDog ? (
          <Link
            href={`/dogs/${assignedDog.id}`}
            className="block rounded-xl border border-hairline bg-canvas p-3 transition-colors hover:bg-surface-soft"
          >
            <div className="flex items-center gap-3">
              {assignedDog.thumbnail_url ? (
                <img src={assignedDog.thumbnail_url} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-surface-card" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-ink">{assignedDog.name}</p>
                <p className="text-[11.5px] text-muted">
                  {assignedDog.sex === 'male' ? t('Macho') : assignedDog.sex === 'female' ? t('Hembra') : t('Sexo no definido')}
                  {' · '}<span className="underline">{t('Ver ficha')}</span>
                </p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted" />
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-hairline bg-surface-soft p-4 text-center">
            <p className="text-[12.5px] text-muted">{t('Sin cachorro asignado')}</p>
          </div>
        )}
      </Section>

      {/* Importes */}
      <Section title={t('Importes')}>
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t('Seña')} value={money(r.deposit_amount_cents, r.currency || 'EUR')} />
          <Stat label={t('Precio total')} value={money(r.total_price_cents, r.currency || 'EUR')} />
          <Stat
            label={t('Saldo')}
            value={money((r.total_price_cents ?? 0) - (r.deposit_amount_cents ?? 0), r.currency || 'EUR')}
          />
        </div>
      </Section>

      {/* Timeline */}
      <Section title={t('Hitos')}>
        <ol className="space-y-1.5 text-[13px]">
          <Timeline label={t('Reserva creada')} date={r.created_at} done />
          <Timeline label={t('Seña pagada')} date={r.deposit_paid_at} done={!!r.deposit_paid_at} />
          <Timeline label={t('Contrato firmado')} date={r.reservation_signed_at || r.contract_signed_at} done={!!(r.reservation_signed_at || r.contract_signed_at)} />
          <Timeline label={t('Cachorro asignado')} date={r.assigned_at} done={!!r.assigned_at} />
          <Timeline label={t('Pagado completo')} date={r.paid_in_full_at} done={!!r.paid_in_full_at} />
          <Timeline label={t('Entregado')} date={r.delivered_at} done={!!r.delivered_at} />
          {r.cancelled_at && <Timeline label={t('Cancelada')} date={r.cancelled_at} done failed />}
        </ol>
      </Section>

      {/* Contratos */}
      {(r.reservation_contract_url || r.purchase_contract_url) && (
        <Section title={t('Contratos')}>
          <div className="flex flex-wrap gap-2">
            {r.reservation_contract_url && (
              <a href={r.reservation_contract_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[12px] font-medium text-body hover:bg-surface-soft">
                <FileText className="h-3.5 w-3.5" /> {t('Reserva')}
              </a>
            )}
            {r.purchase_contract_url && (
              <a href={r.purchase_contract_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[12px] font-medium text-body hover:bg-surface-soft">
                <FileText className="h-3.5 w-3.5" /> {t('Compra')}
              </a>
            )}
          </div>
        </Section>
      )}

      {/* Modal asignar cachorro */}
      {assignOpen && (
        <AssignDogDialog
          reservationId={r.id}
          dogs={dogs}
          currentDogId={r.puppy_dog_id}
          onClose={() => setAssignOpen(false)}
          onSaved={() => { setAssignOpen(false); onChanged(); router.refresh() }}
        />
      )}
    </div>
  )
}

// ============ TAB 2 — Cliente ============

function ClienteTab({ r }: { r: Reservation }) {
  const t = useT()
  const purpose = r.applicant_purpose ? (PURPOSE_LABEL[r.applicant_purpose] ? t(PURPOSE_LABEL[r.applicant_purpose]) : r.applicant_purpose) : null
  const sexLabel = r.preference_sex === 'male' ? t('Macho') : r.preference_sex === 'female' ? t('Hembra') : null
  const hasContactExtras = r.applicant_country || r.applicant_address || r.applicant_id_doc_number

  return (
    <div className="space-y-5">
      <Section title={t('Contacto')}>
        <dl className="space-y-2.5">
          <Row label={t('Email')}>
            {r.applicant_email ? (
              <a href={`mailto:${r.applicant_email}`} className="text-ink underline">{r.applicant_email}</a>
            ) : '—'}
          </Row>
          <Row label={t('Teléfono')}>
            {r.applicant_phone ? (
              <a href={`tel:${r.applicant_phone}`} className="text-ink underline">{r.applicant_phone}</a>
            ) : '—'}
          </Row>
          <Row label={t('País')}>{r.applicant_country || '—'}</Row>
          <Row label={t('Documento')}>
            {r.applicant_id_doc_number
              ? `${(r.applicant_id_doc_type || 'DNI').toUpperCase()} · ${r.applicant_id_doc_number}`
              : '—'}
          </Row>
          <Row label={t('Dirección')}>
            {r.applicant_address ? (
              <span>
                {r.applicant_address}
                {(r.applicant_postal_code || r.applicant_city) && (
                  <><br />{[r.applicant_postal_code, r.applicant_city].filter(Boolean).join(' · ')}</>
                )}
              </span>
            ) : '—'}
          </Row>
        </dl>
      </Section>

      <Section title={t('Formulario inicial')}>
        <dl className="space-y-2.5">
          <Row label={t('Sexo preferido')}>{sexLabel || '—'}</Row>
          <Row label={t('Color preferido')}>{r.preference_color || '—'}</Row>
          <Row label={t('Propósito')}>{purpose || '—'}</Row>
        </dl>
        {r.applicant_message && (
          <div className="mt-3 rounded-xl border border-hairline bg-surface-soft p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Mensaje del cliente')}</p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] text-ink">{r.applicant_message}</p>
          </div>
        )}
        {!r.preference_color && !sexLabel && !purpose && !r.applicant_message && (
          <p className="mt-2 text-[12.5px] italic text-muted">
            {t('El cliente no rellenó preferencias detalladas.')}
          </p>
        )}
      </Section>

      {r.internal_notes && (
        <Section title={t('Notas internas (privadas)')}>
          <p className="whitespace-pre-wrap rounded-xl bg-amber-50 p-3 text-[13px] text-ink ring-1 ring-amber-200">
            {r.internal_notes}
          </p>
          <p className="mt-2 text-[11px] text-muted">{t('Editar en pestaña')} <strong>{t('Acciones')}</strong>.</p>
        </Section>
      )}
    </div>
  )
}

// ============ TAB 3 — Conversación ============

function ConversacionTab({ r, isPro }: { r: Reservation; isPro: boolean }) {
  const t = useT()
  const subject = encodeURIComponent(t('Re: tu solicitud sobre cachorros'))
  const body = encodeURIComponent(`${t('Hola')} ${r.applicant_name || ''},\n\n${t('Gracias por tu interés.')}\n\n`)
  const mailto = r.applicant_email ? `mailto:${r.applicant_email}?subject=${subject}&body=${body}` : null

  return (
    <div className="space-y-4">
      {/* Acción rápida: mailto */}
      {mailto && (
        <a
          href={mailto}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90"
        >
          <Mail className="h-3.5 w-3.5" /> {t('Responder por email')}
        </a>
      )}

      {/* Placeholder de hilos */}
      <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft px-5 py-10 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-3 text-[14px] font-semibold text-ink">{t('Hilo de conversación')}</p>
        <p className="mt-1 text-[12.5px] text-body">
          {isPro
            ? t('Aquí aparecerán los emails enviados y recibidos cuando actives el Emailbot.')
            : t('Con Pro: el Emailbot puede responder automáticamente y derivar a humano cuando corresponda.')}
        </p>
        {isPro ? (
          <Link
            href="/emailbot"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-on-primary hover:opacity-90"
          >
            <Bot className="h-3.5 w-3.5" /> {t('Configurar Emailbot')}
          </Link>
        ) : (
          <Link
            href="/cuenta/suscripcion"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3.5 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90"
          >
            <Crown className="h-3.5 w-3.5" /> {t('Ver planes Pro')}
          </Link>
        )}
      </div>

      {/* Composer manual placeholder */}
      <div className="rounded-xl border border-hairline bg-canvas p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Composer manual')}</p>
        <p className="mt-1 text-[12px] text-body">
          {t('Disponible cuando se enchufe el envío de emails outbound (Resend + emailbot). De momento usa el botón "Responder por email" de arriba que abre tu cliente de correo.')}
        </p>
      </div>
    </div>
  )
}

// ============ Helpers UI ============

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
        active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'
      }`}
    >
      {label}
    </button>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-[13px]">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-ink">{value}</p>
    </div>
  )
}

function Timeline({
  label, date, done, failed,
}: {
  label: string; date: string | null | undefined; done: boolean; failed?: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <span className={`inline-flex h-2 w-2 flex-shrink-0 rounded-full ${
          failed ? 'bg-rose-500' : done ? 'bg-emerald-500' : 'bg-stone-300'
        }`} />
        <span className={done ? 'text-ink' : 'text-muted'}>{label}</span>
      </span>
      <span className="font-mono text-[10.5px] text-muted">{date ? fmtDateTime(date) : '—'}</span>
    </li>
  )
}

// ============ AssignDogDialog ============

function AssignDogDialog({
  reservationId, dogs, currentDogId, onClose, onSaved,
}: {
  reservationId: string
  dogs: DogOption[]
  currentDogId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const t = useT()
  const [selectedId, setSelectedId] = useState(currentDogId || '')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = dogs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true); setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('puppy_reservations')
      .update({ puppy_dog_id: selectedId, assigned_at: new Date().toISOString() })
      .eq('id', reservationId)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-canvas shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">{t('Asignar cachorro')}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-soft hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Buscar por nombre…')}
            className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13.5px] text-ink focus:border-ink focus:outline-none"
          />

          <div className="max-h-72 overflow-y-auto rounded-lg border border-hairline">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12.5px] text-muted">
                {t('No hay perros que coincidan.')}
              </p>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {filtered.map((d) => {
                  const isSelected = selectedId === d.id
                  return (
                    <li key={d.id}>
                      <button
                        onClick={() => setSelectedId(d.id)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-surface-card' : 'hover:bg-surface-soft'
                        }`}
                      >
                        {d.thumbnail_url ? (
                          <img src={d.thumbnail_url} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-surface-card" />
                        )}
                        <span className="flex-1 truncate text-[13.5px] text-ink">{d.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body hover:bg-surface-soft"
            >
              {t('Cancelar')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedId}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary hover:opacity-90 disabled:opacity-40"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('Asignar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
