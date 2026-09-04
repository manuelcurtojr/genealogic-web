import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getLead, getLeadActivation } from '@/lib/marketing/queries'
import { stageMeta, sourceLabel } from '@/lib/marketing/types'
import LeadDetailActions from '@/components/admin/marketing/lead-detail-actions'
import { ArrowLeft, Globe, AtSign, Mail, Phone, Dog, CheckCircle2, XCircle, Sparkles, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmt(d: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}
function fmtDT(d: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return d
  }
}
const EVENT_LABEL: Record<string, string> = {
  lead_created: 'Lead creado',
  email_sent: 'Email enviado',
  email_replied: 'Respondió',
  stage_changed: 'Cambio de etapa',
  registered: 'Se registró',
  added_dog: 'Añadió perro',
  visited_page: 'Visitó la ficha',
  upgraded_pro: 'Pasó a Pro',
  unsubscribed: 'Baja',
  note: 'Nota',
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const res = await getLead(admin, id)
  if (!res) notFound()
  const { lead, events } = res
  const act = await getLeadActivation(admin, lead)
  const sm = stageMeta(lead.stage)

  return (
    <div className="max-w-5xl">
      <Link href="/admin/marketing" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver al CRM
      </Link>

      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-ink">{lead.kennel_name || 'Sin nombre'}</h1>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
          style={{ background: sm.color }}
        >
          {sm.label}
        </span>
        <span className="text-xs text-muted">· {sourceLabel(lead.source)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Contacto */}
          <section className="rounded-xl border border-hairline bg-canvas p-4">
            <h2 className="text-sm font-bold text-ink mb-3">Contacto</h2>
            <div className="grid gap-2 text-sm">
              <Row icon={Mail} label="Email" value={lead.email} />
              <Row icon={Phone} label="Teléfono" value={lead.phone} />
              <Row icon={Globe} label="Web" value={lead.website} link />
              <Row icon={AtSign} label="Instagram" value={lead.instagram} />
              <Row icon={Dog} label="Raza" value={lead.breed_focus} />
              <Row icon={MapPin} label="Zona" value={[lead.region, lead.country].filter(Boolean).join(', ') || null} />
            </div>
          </section>

          {/* Activación en vivo */}
          <section className="rounded-xl border border-hairline bg-canvas p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-ink" />
              <h2 className="text-sm font-bold text-ink">Activación en vivo</h2>
            </div>

            <div className="mb-3 flex items-center gap-2 text-sm">
              {act.claimed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-ink font-medium">Cuenta reclamada</span>
                  <span className="text-muted">
                    · registrado {fmt(act.registeredAt)} · plan {act.plan || 'free'} · última vez {fmt(act.lastSeenAt)}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-ink font-medium">Aún no ha reclamado su cuenta</span>
                </>
              )}
            </div>

            {lead.matched_kennel_id ? (
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Perros en la DB" value={act.dogsTotal} />
                <Stat label="Importados" value={act.dogsImported} />
                <Stat label="Ya reclamados" value={act.dogsClaimed} />
              </div>
            ) : (
              <p className="text-xs text-muted">Este lead no está enlazado a ningún criadero de la base de datos.</p>
            )}
            {lead.matched_kennel_id && act.dogsTotal > 0 && !act.claimed && (
              <p className="mt-3 text-xs text-body">
                🐴 Gancho: <b>{act.dogsTotal} de sus perros ya están en Genealogic</b>. Ese es el asunto del primer email.
              </p>
            )}
          </section>

          {/* Timeline */}
          <section className="rounded-xl border border-hairline bg-canvas p-4">
            <h2 className="text-sm font-bold text-ink mb-3">Historial</h2>
            {events.length === 0 ? (
              <p className="text-xs text-muted">Sin actividad todavía.</p>
            ) : (
              <ul className="space-y-2.5">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium text-ink">{EVENT_LABEL[e.type] || e.type}</span>
                      {e.detail && <span className="text-body"> · {e.detail}</span>}
                      <span className="block text-[11px] text-muted">{fmtDT(e.occurred_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Mensajes (Fase 2) */}
          <section className="rounded-xl border border-dashed border-hairline bg-surface-soft p-4">
            <h2 className="text-sm font-bold text-ink mb-1">Bandeja de emails</h2>
            <p className="text-xs text-muted">
              La conversación por email (envío, respuestas, seguimiento) se conecta en la Fase 2.
            </p>
          </section>
        </div>

        {/* Columna derecha: acciones */}
        <div>
          <LeadDetailActions lead={lead} />
        </div>
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
  link,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  value: string | null
  link?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted flex-shrink-0" />
      <span className="text-muted w-20 flex-shrink-0 text-xs">{label}</span>
      {value ? (
        link ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noreferrer"
            className="text-ink hover:underline truncate"
          >
            {value}
          </a>
        ) : (
          <span className="text-ink truncate">{value}</span>
        )
      ) : (
        <span className="text-muted">—</span>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-center">
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  )
}
