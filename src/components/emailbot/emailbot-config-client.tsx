'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, BookOpen, MessageSquare, Beaker, AlertTriangle, Power, ExternalLink, Copy, Check, Cpu, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AI_MODELS, getDefaultModel, getModel } from '@/lib/ai/models'
import type { QuotaStatus } from '@/lib/ai/quotas'
import { useT } from '@/components/i18n/locale-provider'

interface Config {
  kennel_id: string
  is_enabled: boolean
  inbound_address: string | null
  reply_from_name: string | null
  reply_from_email: string | null
  signature: string | null
  fallback_after_n_replies: number | null
  last_inbound_at: string | null
}

interface Props {
  kennelId: string
  kennelName: string
  kennelSlug: string
  initialConfig: Config | null
  initialBotModel: string | null
  quota: QuotaStatus
  stats: {
    knowledgeCount: number
    threadsTotal: number
    threads30d: number
    escalated: number
  }
}

export default function EmailbotConfigClient({
  kennelId, kennelName, kennelSlug, initialConfig, initialBotModel, quota, stats,
}: Props) {
  const t = useT()
  const [botModel, setBotModel] = useState<string>(initialBotModel || getDefaultModel().id)
  const [savingModel, setSavingModel] = useState(false)

  async function saveBotModel(newId: string) {
    const prev = botModel
    setBotModel(newId)
    setSavingModel(true)
    try {
      const res = await fetch('/api/emailbot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, bot_model: newId }),
      })
      if (!res.ok) throw new Error(t('Error al guardar modelo'))
    } catch (err: any) {
      alert(err.message)
      setBotModel(prev)
    } finally {
      setSavingModel(false)
    }
  }

  const [cfg, setCfg] = useState<Config>(() => initialConfig || {
    kennel_id: kennelId,
    is_enabled: false,
    inbound_address: `${kennelSlug}@inbound.genealogic.io`,
    reply_from_name: kennelName,
    reply_from_email: null,
    signature: null,
    fallback_after_n_replies: 3,
    last_inbound_at: null,
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const ready = stats.knowledgeCount > 0

  async function save(partial: Partial<Config>) {
    const next = { ...cfg, ...partial }
    setCfg(next)
    setSaving(true)
    try {
      const res = await fetch('/api/emailbot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, ...partial }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || t('Error al guardar'))
      }
      const data = await res.json()
      setCfg(data.config)
    } catch (err: any) {
      alert(err.message)
      setCfg(cfg) // revert
    } finally {
      setSaving(false)
    }
  }

  function copyInbound() {
    if (!cfg.inbound_address) return
    navigator.clipboard.writeText(cfg.inbound_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-muted" />
            Emailbot
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {t('Tu asistente de email para responder consultas con tu Biblioteca como contexto.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/emailbot/test" className="text-xs font-medium text-body hover:text-ink border border-hairline rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 hover:bg-surface-soft transition">
            <Beaker className="w-3.5 h-3.5" /> {t('Test')}
          </Link>
          <Link href="/emailbot/hilos" className="text-xs font-medium text-body hover:text-ink border border-hairline rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 hover:bg-surface-soft transition">
            <MessageSquare className="w-3.5 h-3.5" /> {t('Hilos')}
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label={t('Biblioteca')} value={stats.knowledgeCount} sub={t('entradas activas')} href="/conocimiento" />
        <StatBox label={t('Hilos totales')} value={stats.threadsTotal} href="/emailbot/hilos" />
        <StatBox label={t('Activos (30d)')} value={stats.threads30d} href="/emailbot/hilos" />
        <StatBox label={t('Escalados')} value={stats.escalated} sub={t('derivados a ti')} href="/emailbot/hilos" />
      </div>

      {/* Knowledge prerequisite */}
      {!ready && (
        <div className="flex items-start gap-3 bg-surface-card border border-hairline rounded-xl p-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-body">
            <p className="mb-1"><strong>{t('La Biblioteca está vacía.')}</strong></p>
            <p>
              {t('Para activar el bot necesitas al menos una entrada en la')}{' '}
              <Link href="/conocimiento" className="font-semibold text-ink underline">{t('Biblioteca')}</Link>.
              {' '}{t('El bot responde basándose en lo que tú le hayas dicho — sin entradas, responde demasiado genérico.')}
            </p>
          </div>
        </div>
      )}

      {/* Uso mensual + barra de cuota */}
      <QuotaCard quota={quota} />

      {/* Selector de modelo IA */}
      <div className="rounded-2xl border border-hairline bg-canvas p-5 lg:p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-4 h-4 text-ink" />
          <p className="text-sm font-semibold text-ink">{t('Modelo de IA')}</p>
          {savingModel && <span className="text-[11px] text-muted">{t('guardando...')}</span>}
        </div>
        <p className="text-xs text-muted mb-4">
          {t('Elige el modelo que usará el bot para responder. Cuesta más calidad, menos coste por email. Genealogic se encarga de las APIs — tu plan cubre el uso normal.')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {AI_MODELS.map((m) => {
            const active = m.id === botModel
            const SpeedIcon = m.speedTier === 'fast' ? Zap
                            : m.speedTier === 'premium' ? Star
                            : Cpu
            return (
              <button
                key={m.id}
                onClick={() => saveBotModel(m.id)}
                disabled={savingModel}
                className={`text-left rounded-lg border p-3 transition ${
                  active
                    ? 'border-ink bg-surface-card ring-2 ring-ink/20'
                    : 'border-hairline bg-canvas hover:border-ink/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <SpeedIcon className={`w-3.5 h-3.5 flex-shrink-0 ${
                      m.speedTier === 'fast' ? 'text-emerald-600'
                      : m.speedTier === 'premium' ? 'text-amber-600'
                      : 'text-blue-600'
                    }`} />
                    <p className="text-sm font-bold text-ink truncate">{m.label}</p>
                  </div>
                  {active && <Check className="w-4 h-4 text-ink flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-muted line-clamp-2 leading-snug">
                  {m.shortDescription}
                </p>
                <p className="text-[10px] text-muted mt-1.5 font-mono">
                  ${m.pricePer1MInput}/M in · ${m.pricePer1MOutput}/M out
                </p>
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-muted mt-3">
          {t('Modelo activo:')} <strong className="text-ink">{getModel(botModel).label}</strong>
          {' '}({getModel(botModel).provider})
        </p>
      </div>

      {/* Enable toggle */}
      <div className="rounded-2xl border border-hairline bg-canvas p-5 lg:p-6 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 mb-1">
              <Power className={`w-4 h-4 ${cfg.is_enabled ? 'text-ink' : 'text-muted'}`} />
              <p className="text-sm font-semibold text-ink">{t('Auto-responder activo')}</p>
              {cfg.is_enabled ? (
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] bg-ink text-on-primary rounded-full px-2 py-0.5">On</span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] bg-surface-card text-muted rounded-full px-2 py-0.5">Off</span>
              )}
            </div>
            <p className="text-sm text-muted">
              {t('Cuando está activo, el bot responde automáticamente a emails entrantes en la dirección de abajo. Cuando está apagado, los emails se guardan pero no se responden.')}
            </p>
          </div>
          <Button
            variant={cfg.is_enabled ? 'secondary' : 'primary'} size="sm"
            disabled={saving || (!ready && !cfg.is_enabled)}
            onClick={() => save({ is_enabled: !cfg.is_enabled })}
          >
            {cfg.is_enabled ? t('Desactivar') : t('Activar bot')}
          </Button>
        </div>
      </div>

      {/* Inbound address card */}
      <div className="rounded-2xl border border-hairline bg-canvas p-5 lg:p-6 mb-4">
        <p className="text-sm font-semibold text-ink mb-1">{t('Dirección de recepción')}</p>
        <p className="text-sm text-muted mb-4">
          {t('Los emails que lleguen a esta dirección se procesan automáticamente. Reenvía aquí desde tu inbox real (o configura un alias) para que el bot tome el control.')}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="flex-1 min-w-[260px] bg-surface-card border border-hairline rounded-lg px-3 py-2 text-sm font-mono text-ink">
            {cfg.inbound_address || '—'}
          </code>
          <Button variant="secondary" size="sm" onClick={copyInbound}>
            {copied ? <><Check className="w-3.5 h-3.5" /> {t('Copiado')}</> : <><Copy className="w-3.5 h-3.5" /> {t('Copiar')}</>}
          </Button>
        </div>
      </div>

      {/* Reply identity */}
      <div className="rounded-2xl border border-hairline bg-canvas p-5 lg:p-6 mb-4">
        <p className="text-sm font-semibold text-ink mb-1">{t('Identidad de respuesta')}</p>
        <p className="text-sm text-muted mb-4">
          {t('Cómo aparece el remitente cuando el bot responde. Usa tu dominio personal si quieres que vaya en tu nombre.')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label={t('Nombre')}>
            <input
              type="text"
              defaultValue={cfg.reply_from_name || ''}
              onBlur={e => e.target.value !== cfg.reply_from_name && save({ reply_from_name: e.target.value || null })}
              className="input" placeholder="Irema Curtó"
            />
          </Field>
          <Field label={t('Email')}>
            <input
              type="email"
              defaultValue={cfg.reply_from_email || ''}
              onBlur={e => e.target.value !== cfg.reply_from_email && save({ reply_from_email: e.target.value || null })}
              className="input" placeholder="hola@iremacurto.com"
            />
          </Field>
        </div>
      </div>

      {/* Signature + escalation threshold */}
      <div className="rounded-2xl border border-hairline bg-canvas p-5 lg:p-6 mb-4">
        <Field label={t('Firma (se añade al final de cada respuesta)')}>
          <textarea
            defaultValue={cfg.signature || ''}
            onBlur={e => e.target.value !== cfg.signature && save({ signature: e.target.value || null })}
            className="input min-h-[80px]"
            placeholder="—\nIrema Curtó · Criadero\nwhatsapp: +34 600 000 000"
          />
        </Field>
        <div className="mt-4">
          <Field label={t('Derivar a humano después de N respuestas automáticas')}>
            <input
              type="number" min={1} max={20}
              defaultValue={cfg.fallback_after_n_replies || 3}
              onBlur={e => {
                const v = parseInt(e.target.value)
                if (v && v !== cfg.fallback_after_n_replies) save({ fallback_after_n_replies: v })
              }}
              className="input max-w-[120px]"
            />
          </Field>
        </div>
      </div>

      {/* Last inbound */}
      {cfg.last_inbound_at && (
        <p className="text-xs text-muted text-center">
          {t('Último email recibido:')} {new Date(cfg.last_inbound_at).toLocaleString('es-ES')}
        </p>
      )}

      {/* Setup notes */}
      <div className="mt-8 rounded-xl border border-hairline bg-surface-card p-5">
        <p className="text-sm font-semibold text-ink mb-2 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" /> {t('Setup técnico (una sola vez)')}
        </p>
        <ol className="text-sm text-body space-y-1.5 list-decimal pl-5">
          <li>{t('Configura el dominio inbound en Resend (o el provider que prefieras) — p.ej.')} <code className="text-[12px] bg-canvas border border-hairline rounded px-1">inbound.genealogic.io</code>.</li>
          <li>{t('Añade los registros MX que indique Resend.')}</li>
          <li>{t('En Resend crea una Inbound webhook apuntando a')} <code className="text-[12px] bg-canvas border border-hairline rounded px-1">https://genealogic.io/api/emailbot/inbound</code> {t('con header')} <code className="text-[12px] bg-canvas border border-hairline rounded px-1">X-Inbound-Secret: {'<EMAILBOT_INBOUND_SECRET>'}</code>.</li>
          <li>{t('En Vercel define las env vars')} <code className="text-[12px] bg-canvas border border-hairline rounded px-1">EMAILBOT_INBOUND_SECRET</code> {t('y')} <code className="text-[12px] bg-canvas border border-hairline rounded px-1">RESEND_API_KEY</code>.</li>
          <li>{t('Confirma que la dirección de arriba aparece en el campo «to» del webhook de Resend.')}</li>
        </ol>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--hairline, #e5e5e5);
          border-radius: 8px;
          background: #fff;
          font-size: 14px;
          color: var(--ink, #0f0f0f);
          outline: none;
          font-family: inherit;
        }
        :global(.input:focus) { border-color: var(--ink, #0f0f0f); }
      `}</style>
    </div>
  )
}

function StatBox({ label, value, sub, href }: { label: string; value: number; sub?: string; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-hairline bg-canvas p-4 hover:border-ink/30 transition h-full">
      <p className="text-2xl font-bold text-ink leading-none">{value.toLocaleString('es-ES')}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mt-2">{label}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function QuotaCard({ quota }: { quota: QuotaStatus }) {
  const t = useT()
  const isUnlimited = quota.limit < 0
  const isBlocked = !quota.allowed
  const pct = isUnlimited || quota.limit === 0
    ? 0
    : Math.min(100, Math.round((quota.used / quota.limit) * 100))

  // Color de la barra y el ribete
  let barColor = 'bg-emerald-500'
  let ringColor = 'border-hairline'
  if (isBlocked) { barColor = 'bg-red-500'; ringColor = 'border-red-300' }
  else if (quota.isNearLimit) { barColor = 'bg-amber-500'; ringColor = 'border-amber-300' }
  else if (pct >= 75) { barColor = 'bg-amber-500' }

  const planLabel = quota.plan.charAt(0).toUpperCase() + quota.plan.slice(1)

  return (
    <div className={`rounded-2xl border-2 ${ringColor} bg-canvas p-5 lg:p-6 mb-4`}>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {t('Uso este mes · plan')} {planLabel}
          </p>
          <p className="mt-1 text-2xl font-bold text-ink tabular-nums">
            {quota.used.toLocaleString('es-ES')}
            {!isUnlimited && (
              <span className="text-muted font-normal text-base"> / {quota.limit.toLocaleString('es-ES')}</span>
            )}
            <span className="text-muted font-normal text-sm ml-2">
              {quota.used === 1 ? t('respuesta del bot') : t('respuestas del bot')}
            </span>
          </p>
        </div>
        {isBlocked && (
          <Link
            href="/cuenta/suscripcion"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-4 py-2 text-sm font-semibold hover:opacity-90"
          >
            {t('Subir de plan')}
          </Link>
        )}
        {isUnlimited && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
            {t('Ilimitado')}
          </span>
        )}
      </div>

      {!isUnlimited && quota.limit > 0 && (
        <>
          <div className="h-2 rounded-full bg-surface-card overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-muted">
              {quota.remaining > 0
                ? `${quota.remaining.toLocaleString('es-ES')} ${t('respuestas restantes')}`
                : t('Cuota agotada')}
            </p>
            <p className="text-[11px] text-muted">{pct}%</p>
          </div>
        </>
      )}

      {isBlocked && (
        <p className="mt-3 text-xs text-red-700">
          {quota.reason === 'plan_no_bot'
            ? `${t('Tu plan')} ${planLabel} ${t('no incluye el emailbot. El emailbot está en Kennel Pro (próximamente). Apúntate a la lista de espera en /pricing.')}`
            : t('Has agotado las respuestas del mes. El bot dejará de contestar emails hasta el día 1. Los emails entrantes siguen guardándose en /emailbot/hilos para que respondas tú.')}
        </p>
      )}
      {!isBlocked && quota.isNearLimit && !isUnlimited && (
        <p className="mt-3 text-xs text-amber-700">
          ⚠️ {t('Te quedan')} {quota.remaining} {t('respuestas este mes. Considera subir de plan si tu volumen crece.')}
        </p>
      )}

      <p className="mt-3 text-[11px] text-muted">
        {t('Detalles e historial en')}{' '}
        <Link href="/cuenta/facturacion" className="font-semibold text-ink hover:underline">
          /cuenta/facturación
        </Link>
        . {t('Solo cuentan las respuestas reales del bot; el playground y los imports no consumen cuota.')}
      </p>
    </div>
  )
}
