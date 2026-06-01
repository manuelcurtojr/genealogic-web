/**
 * Vista cliente de Contactos con 3 tabs (Suscriptores / Leads / Clientes).
 *
 * Cada tab tiene su propia tabla con columnas relevantes + búsqueda
 * compartida. El contador junto al tab muestra el total actual; el
 * subtítulo muestra cuántos coinciden con la búsqueda.
 *
 * Las filas son clicables → llevan a la entidad relevante:
 *   - Suscriptor: link a /newsletter (gestión global)
 *   - Lead:       link a /reservas/[id] (detalle reserva)
 *   - Cliente:    link a /reservas/[id] si viene de reserva
 *                 o panel edit del CRM si viene de owners
 */
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus, Search, Mail, Phone, MapPin, Tag, Inbox, UserPlus, Users,
  PartyPopper, Dog, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n/locale-provider'
import OwnerFormPanel from '@/components/clientes/owner-form-panel'

export type Subscriber = {
  id: string
  email: string
  full_name: string | null
  source: string | null
  tags: string[] | null
  is_active: boolean
  subscribed_at: string
  unsubscribed_at: string | null
}

export type Lead = {
  id: string
  applicant_name: string | null
  applicant_email: string | null
  applicant_phone: string | null
  applicant_city: string | null
  status: string
  created_at: string
  preference_sex: string | null
  preference_color: string | null
  deposit_amount_cents: number | null
  currency: string | null
  dog_id: string | null
}

export type Client = {
  key: string
  source: 'crm' | 'reservation'
  full_name: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  last_activity: string | null
  reservations_count: number
  delivered_count: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last_dog: any
  /** Solo si el cliente vino de la tabla owners (CRM) */
  crm_owner_id: string | null
}

type Tab = 'subscribers' | 'leads' | 'clients'

const TABS: { id: Tab; label: string; icon: typeof Mail }[] = [
  { id: 'subscribers', label: 'Suscriptores', icon: Mail },
  { id: 'leads',       label: 'Leads',        icon: UserPlus },
  { id: 'clients',     label: 'Clientes',     icon: Users },
]

const LEAD_STATUS_LABEL: Record<string, string> = {
  interested:   'Interesado',
  deposit_paid: 'Señal pagada',
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtPrice(cents: number | null, currency: string | null): string {
  if (cents == null) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(cents / 100)
}

export default function ContactosPageClient({
  kennelId, kennelName, subscribers, leads, clients,
}: {
  kennelId: string
  kennelName: string
  subscribers: Subscriber[]
  leads: Lead[]
  clients: Client[]
}) {
  const t = useT()
  const [tab, setTab] = useState<Tab>('subscribers')
  const [query, setQuery] = useState('')

  // Panel del CRM (crear cliente manual)
  const [panelOpen, setPanelOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingOwner, setEditingOwner] = useState<any>(null)

  // Filtered counts según query y tab activa
  const q = query.trim().toLowerCase()

  const filteredSubs = useMemo(() => {
    if (!q) return subscribers
    return subscribers.filter(s =>
      s.email.toLowerCase().includes(q) ||
      s.full_name?.toLowerCase().includes(q) ||
      s.tags?.some(tg => tg.toLowerCase().includes(q))
    )
  }, [subscribers, q])

  const filteredLeads = useMemo(() => {
    if (!q) return leads
    return leads.filter(l =>
      l.applicant_name?.toLowerCase().includes(q) ||
      l.applicant_email?.toLowerCase().includes(q) ||
      l.applicant_phone?.includes(q) ||
      l.applicant_city?.toLowerCase().includes(q) ||
      l.preference_color?.toLowerCase().includes(q)
    )
  }, [leads, q])

  const filteredClients = useMemo(() => {
    if (!q) return clients
    return clients.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.city?.toLowerCase().includes(q)
    )
  }, [clients, q])

  const counts: Record<Tab, number> = {
    subscribers: subscribers.length,
    leads:       leads.length,
    clients:     clients.length,
  }
  const filteredCount =
    tab === 'subscribers' ? filteredSubs.length :
    tab === 'leads'       ? filteredLeads.length :
                            filteredClients.length

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            {kennelName}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-ink tracking-tight">{t('Contactos')}</h1>
          <p className="text-sm text-muted mt-1">
            {t('Suscriptores del newsletter, leads de solicitudes y clientes que cerraron.')}
          </p>
        </div>
        {tab === 'clients' && (
          <Button
            onClick={() => { setEditingOwner(null); setPanelOpen(true) }}
            size="md"
            variant="primary"
          >
            <Plus className="w-4 h-4" />
            {t('Nuevo cliente manual')}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hairline mb-4 -mx-2 sm:mx-0">
        {TABS.map((tabItem) => {
          const Icon = tabItem.icon
          const active = tab === tabItem.id
          return (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                active
                  ? 'border-ink text-ink'
                  : 'border-transparent text-muted hover:text-body'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(tabItem.label)}
              <span
                className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${
                  active ? 'bg-ink text-on-primary' : 'bg-surface-card text-muted'
                }`}
              >
                {counts[tabItem.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Buscar por nombre, email, teléfono…')}
          className="w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
        />
      </div>

      {q && (
        <p className="text-xs text-muted mb-3">
          {filteredCount} {t('de')} {counts[tab]} {tab === 'subscribers' ? t('suscriptores') : tab === 'leads' ? t('leads') : t('clientes')} {t('coinciden con')} &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Tab content */}
      {tab === 'subscribers' && <SubscribersTable rows={filteredSubs} total={counts.subscribers} />}
      {tab === 'leads'       && <LeadsTable rows={filteredLeads} total={counts.leads} />}
      {tab === 'clients'     && (
        <ClientsTable
          rows={filteredClients}
          total={counts.clients}
          onEditOwner={(owner) => { setEditingOwner(owner); setPanelOpen(true) }}
        />
      )}

      {/* CRM panel para crear/editar owner manual */}
      <OwnerFormPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditingOwner(null) }}
        onSaved={() => { setPanelOpen(false); setEditingOwner(null); window.location.reload() }}
        onDeleted={() => { setPanelOpen(false); setEditingOwner(null); window.location.reload() }}
        editing={editingOwner}
        kennelId={kennelId}
      />
    </div>
  )
}

// ─── Tabla SUSCRIPTORES ─────────────────────────────────────────────────────
function SubscribersTable({ rows, total }: { rows: Subscriber[]; total: number }) {
  const t = useT()
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title={total === 0 ? t('Sin suscriptores') : t('Ningún suscriptor coincide')}
        description={
          total === 0
            ? t('Cuando alguien se suscriba a tu newsletter desde tu web, aparecerá aquí.')
            : undefined
        }
      />
    )
  }
  return (
    <div className="border border-hairline rounded-xl bg-canvas overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-hairline bg-surface-soft/50">
          <tr className="text-left">
            <Th>{t('Email')}</Th>
            <Th hideOn="sm">{t('Nombre')}</Th>
            <Th hideOn="md">{t('Origen')}</Th>
            <Th hideOn="lg">{t('Tags')}</Th>
            <Th align="right">{t('Estado')}</Th>
            <Th align="right">{t('Fecha')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, idx) => (
            <tr
              key={s.id}
              className={`hover:bg-surface-soft transition ${idx > 0 ? 'border-t border-hairline' : ''}`}
            >
              <td className="px-4 py-3">
                <span className="text-ink font-medium">{s.email}</span>
              </td>
              <Td hideOn="sm">{s.full_name || <span className="text-muted">—</span>}</Td>
              <Td hideOn="md">
                {s.source ? (
                  <span className="text-[11px] uppercase tracking-wider text-muted">{s.source}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Td>
              <Td hideOn="lg">
                {s.tags && s.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {s.tags.slice(0, 3).map((tg) => (
                      <span key={tg} className="inline-flex items-center gap-0.5 rounded bg-surface-card px-1.5 py-0.5 text-[10px] text-body">
                        <Tag className="w-2.5 h-2.5" />
                        {tg}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Td>
              <td className="px-4 py-3 text-right">
                {s.is_active ? (
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 rounded-full px-2 py-0.5">
                    {t('Activo')}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold bg-red-50 text-red-700 rounded-full px-2 py-0.5">
                    {t('Baja')}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-[12px] text-muted">
                {fmtDate(s.subscribed_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-3 border-t border-hairline bg-surface-soft/30 text-[11px] text-muted text-right">
        {t('Gestionar campañas en')}{' '}
        <Link href="/newsletter" className="font-semibold text-ink hover:underline">
          /newsletter →
        </Link>
      </div>
    </div>
  )
}

// ─── Tabla LEADS ────────────────────────────────────────────────────────────
function LeadsTable({ rows, total }: { rows: Lead[]; total: number }) {
  const t = useT()
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={total === 0 ? t('Sin leads abiertos') : t('Ningún lead coincide')}
        description={
          total === 0
            ? t('Los leads son interesados que han enviado solicitud pero no han cerrado todavía. Aparecen aquí cuando llega un formulario de contacto o se paga una señal.')
            : undefined
        }
      />
    )
  }
  return (
    <div className="border border-hairline rounded-xl bg-canvas overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-hairline bg-surface-soft/50">
          <tr className="text-left">
            <Th>{t('Lead')}</Th>
            <Th hideOn="md">{t('Contacto')}</Th>
            <Th hideOn="lg">{t('Preferencias')}</Th>
            <Th align="right">{t('Estado')}</Th>
            <Th align="right">{t('Fecha')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l, idx) => (
            <tr
              key={l.id}
              className={`hover:bg-surface-soft transition ${idx > 0 ? 'border-t border-hairline' : ''}`}
            >
              <td className="px-4 py-3">
                <Link
                  href={`/reservas/${l.id}`}
                  className="text-ink font-medium hover:underline"
                >
                  {l.applicant_name || t('Sin nombre')}
                </Link>
                {l.applicant_city && (
                  <p className="text-[11px] text-muted mt-0.5 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {l.applicant_city}
                  </p>
                )}
              </td>
              <Td hideOn="md">
                <div className="flex flex-col gap-0.5">
                  {l.applicant_email && (
                    <span className="text-[12px] text-body inline-flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-muted" />
                      {l.applicant_email}
                    </span>
                  )}
                  {l.applicant_phone && (
                    <span className="text-[12px] text-body inline-flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-muted" />
                      {l.applicant_phone}
                    </span>
                  )}
                </div>
              </Td>
              <Td hideOn="lg">
                <div className="flex flex-col text-[12px] text-body">
                  {l.preference_sex && (
                    <span>{l.preference_sex === 'male' ? `♂ ${t('Macho')}` : `♀ ${t('Hembra')}`}</span>
                  )}
                  {l.preference_color && <span>{l.preference_color}</span>}
                  {!l.preference_sex && !l.preference_color && (
                    <span className="text-muted">—</span>
                  )}
                </div>
              </Td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                    l.status === 'deposit_paid'
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  {LEAD_STATUS_LABEL[l.status] ? t(LEAD_STATUS_LABEL[l.status]) : l.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-[12px] text-muted whitespace-nowrap">
                {fmtDate(l.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-3 border-t border-hairline bg-surface-soft/30 text-[11px] text-muted text-right">
        {t('Pipeline completo en')}{' '}
        <Link href="/reservas" className="font-semibold text-ink hover:underline">
          /reservas →
        </Link>
      </div>
    </div>
  )
}

// ─── Tabla CLIENTES ─────────────────────────────────────────────────────────
function ClientsTable({
  rows, total, onEditOwner,
}: {
  rows: Client[]
  total: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEditOwner: (owner: any) => void
}) {
  const t = useT()
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={total === 0 ? t('Sin clientes todavía') : t('Ningún cliente coincide')}
        description={
          total === 0
            ? t('Cuando un lead se convierte (asignación de cachorro, contrato firmado, entrega) aparece aquí. También puedes añadir clientes manualmente.')
            : undefined
        }
      />
    )
  }
  return (
    <div className="border border-hairline rounded-xl bg-canvas overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-hairline bg-surface-soft/50">
          <tr className="text-left">
            <Th>{t('Cliente')}</Th>
            <Th hideOn="md">{t('Contacto')}</Th>
            <Th hideOn="lg">{t('Ubicación')}</Th>
            <Th hideOn="md">{t('Último perro')}</Th>
            <Th align="right">{t('Reservas')}</Th>
            <Th align="right">{t('Actividad')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, idx) => {
            const handleClick = () => {
              if (c.source === 'crm' && c.crm_owner_id) {
                onEditOwner({
                  id: c.crm_owner_id,
                  full_name: c.full_name,
                  email: c.email,
                  phone: c.phone,
                  city: c.city,
                  country: c.country,
                })
              }
            }
            return (
              <tr
                key={c.key}
                onClick={c.source === 'crm' ? handleClick : undefined}
                className={`${c.source === 'crm' ? 'cursor-pointer' : ''} hover:bg-surface-soft transition ${idx > 0 ? 'border-t border-hairline' : ''}`}
              >
                <td className="px-4 py-3">
                  <p className="text-ink font-medium">
                    {c.full_name || <span className="text-muted">{t('Sin nombre')}</span>}
                  </p>
                  {c.delivered_count > 0 && (
                    <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider inline-flex items-center gap-1 mt-0.5">
                      <PartyPopper className="w-3 h-3" />
                      {t('Recibió')} {c.delivered_count}
                    </p>
                  )}
                </td>
                <Td hideOn="md">
                  <div className="flex flex-col gap-0.5">
                    {c.email && (
                      <span className="text-[12px] text-body inline-flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted" />
                        {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="text-[12px] text-body inline-flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-muted" />
                        {c.phone}
                      </span>
                    )}
                    {!c.email && !c.phone && <span className="text-muted text-[12px]">—</span>}
                  </div>
                </Td>
                <Td hideOn="lg">
                  {(c.city || c.country) ? (
                    <span className="text-[12px] text-body inline-flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-muted" />
                      {[c.city, c.country].filter(Boolean).join(', ')}
                    </span>
                  ) : <span className="text-[12px] text-muted">—</span>}
                </Td>
                <Td hideOn="md">
                  {c.last_dog ? (
                    <Link
                      href={`/dogs/${c.last_dog.slug || c.last_dog.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 hover:underline"
                    >
                      {c.last_dog.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.last_dog.thumbnail_url}
                          alt={c.last_dog.name}
                          className="w-7 h-7 rounded object-cover border border-hairline"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded bg-surface-card flex items-center justify-center text-[10px] font-bold text-ink border border-hairline">
                          {c.last_dog.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="text-[12px] text-body truncate max-w-[120px]">
                        {c.last_dog.name}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-[12px] text-muted inline-flex items-center gap-1">
                      <Dog className="w-3 h-3" />
                      —
                    </span>
                  )}
                </Td>
                <td className="px-4 py-3 text-right">
                  {c.reservations_count > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-body">
                      <span className="font-bold text-ink tabular-nums">{c.reservations_count}</span>
                      <span className="text-muted">
                        {c.reservations_count === 1 ? t('reserva') : t('reservas')}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted">{t('manual')}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-[12px] text-muted whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fmtDate(c.last_activity)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Utilities ──────────────────────────────────────────────────────────────
function Th({
  children, align = 'left', hideOn,
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
  hideOn?: 'sm' | 'md' | 'lg'
}) {
  const hide = hideOn === 'sm' ? 'hidden sm:table-cell'
    : hideOn === 'md' ? 'hidden md:table-cell'
    : hideOn === 'lg' ? 'hidden lg:table-cell' : ''
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted ${align === 'right' ? 'text-right' : ''} ${hide}`}
    >
      {children}
    </th>
  )
}

function Td({
  children, hideOn,
}: {
  children: React.ReactNode
  hideOn?: 'sm' | 'md' | 'lg'
}) {
  const hide = hideOn === 'sm' ? 'hidden sm:table-cell'
    : hideOn === 'md' ? 'hidden md:table-cell'
    : hideOn === 'lg' ? 'hidden lg:table-cell' : ''
  return <td className={`px-4 py-3 ${hide}`}>{children}</td>
}

function EmptyState({
  icon: Icon, title, description,
}: {
  icon: typeof Mail
  title: string
  description?: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
      <Icon className="mx-auto h-10 w-10 text-muted" />
      <p className="mt-3 text-[14px] font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-2 text-[13px] text-muted max-w-md mx-auto">{description}</p>
      )}
    </div>
  )
}
