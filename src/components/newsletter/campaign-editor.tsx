/**
 * Editor de campaña — client component.
 *
 * Tabs:
 *  - Editar: título, asunto, preheader, body markdown (con preview live),
 *    CTA, hero image, reply-to
 *  - Audiencia: selector + estimación destinatarios
 *  - Enviar: botón Test (envía a 1 email) + botón Enviar (a toda la audiencia,
 *    con modal de confirmación que muestra recipients)
 *
 * Si la campaña ya está 'sent', muestra stats finales y oculta acciones.
 *
 * Autosave cada vez que pierde foco un campo (debounced 800ms).
 */
'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, Users, Send, Loader2, Save, Eye, Beaker, AlertCircle,
  CheckCircle2, X, Trash2, Mail,
} from 'lucide-react'
import { AUDIENCE_LABELS, AUDIENCE_HINTS, type AudienceType } from '@/lib/newsletter/audiences-shared'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { ComingSoonChip } from '@/components/early-access/coming-soon'
import { useT } from '@/components/i18n/locale-provider'
import { Img } from '@/components/ui/img'

export type CampaignRow = {
  id: string
  kennel_id: string
  title: string
  subject: string
  preheader: string | null
  body_markdown: string
  cta_label: string | null
  cta_url: string | null
  hero_image_url: string | null
  reply_to: string | null
  audience_type: AudienceType
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  scheduled_at: string | null
  sent_at: string | null
  recipients_total: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounced_count: number
  unsubscribed_count: number
  failed_count: number
  created_at: string
  updated_at: string
}

export type AudienceCounts = Record<AudienceType, number>

type Tab = 'edit' | 'audience' | 'send'

export default function CampaignEditor({
  kennelName, userEmail, initial, audiences, canSend = false,
}: {
  kennelId: string
  kennelName: string
  userEmail: string
  initial: CampaignRow
  audiences: AudienceCounts
  /** Si el envío real está habilitado. Lo decide el server (gate Enterprise). */
  canSend?: boolean
}) {
  const router = useRouter()
  const t = useT()
  const isLocked = ['sending', 'sent'].includes(initial.status)
  const [tab, setTab] = useState<Tab>(isLocked ? 'send' : 'edit')

  // Form state (controlado, autosave)
  const [draft, setDraft] = useState<CampaignRow>(initial)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  function update<K extends keyof CampaignRow>(key: K, value: CampaignRow[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    scheduleAutosave({ ...draft, [key]: value })
  }

  function scheduleAutosave(latest: CampaignRow) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void save(latest)
    }, 800)
  }

  async function save(latest: CampaignRow = draft) {
    if (isLocked) return
    setSaving(true)
    try {
      const res = await fetch(`/api/newsletter/campaigns/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: latest.title,
          subject: latest.subject,
          preheader: latest.preheader,
          body_markdown: latest.body_markdown,
          cta_label: latest.cta_label,
          cta_url: latest.cta_url,
          hero_image_url: latest.hero_image_url,
          reply_to: latest.reply_to,
          audience_type: latest.audience_type,
        }),
      })
      if (res.ok) setSavedAt(new Date().toLocaleTimeString('es-ES'))
    } finally {
      setSaving(false)
    }
  }

  // ── Send actions ─────────────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, startSending] = useTransition()
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null)

  const [testEmail, setTestEmail] = useState(userEmail)
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  async function sendTest() {
    setTestSending(true); setTestResult(null)
    try {
      const res = await fetch(`/api/newsletter/campaigns/${initial.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: testEmail }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'test_failed')
      setTestResult(`✓ ${t('Prueba enviada a')} ${testEmail}`)
    } catch (e) {
      setTestResult(`✕ ${e instanceof Error ? e.message : t('Error')}`)
    } finally {
      setTestSending(false)
    }
  }

  function launchSend() {
    setConfirmOpen(false); setSendError(null); setSendResult(null)
    startSending(async () => {
      try {
        const res = await fetch(`/api/newsletter/campaigns/${initial.id}/send`, {
          method: 'POST',
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'send_failed')
        setSendResult({ sent: json.sent, failed: json.failed })
        router.refresh()
      } catch (e) {
        setSendError(e instanceof Error ? e.message : t('Error enviando'))
      }
    })
  }

  async function deleteCampaign() {
    if (!confirm(t('¿Borrar esta campaña? No se puede deshacer.'))) return
    const res = await fetch(`/api/newsletter/campaigns/${initial.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/newsletter')
    else alert(t('Error al borrar'))
  }

  const audienceCount = audiences[draft.audience_type] || 0

  return (
    <div>
      {/* Header con título + estado + autosave */}
      <header className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => update('title', e.target.value)}
            disabled={isLocked}
            placeholder={t('Título interno de la campaña')}
            className="w-full text-3xl font-bold tracking-tight text-ink bg-transparent border-0 border-b border-hairline pb-2 focus:outline-none focus:border-ink/30 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center gap-3 text-[12px] text-muted">
            <StatusBadge status={draft.status} t={t} />
            {saving ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('Guardando...')}
              </span>
            ) : savedAt ? (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3 h-3" />
                {t('Guardado')} {savedAt}
              </span>
            ) : null}
          </div>
        </div>
        {!isLocked && draft.status !== 'sending' && (
          <button
            onClick={deleteCampaign}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('Borrar')}
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b border-hairline mb-5">
        <TabButton active={tab === 'edit'} onClick={() => setTab('edit')} icon={FileText} disabled={isLocked}>
          1. {t('Editar contenido')}
        </TabButton>
        <TabButton active={tab === 'audience'} onClick={() => setTab('audience')} icon={Users} disabled={isLocked}>
          2. {t('Audiencia')} ({audienceCount})
        </TabButton>
        <TabButton active={tab === 'send'} onClick={() => setTab('send')} icon={Send}>
          3. {isLocked ? t('Resultado') : t('Enviar')}
        </TabButton>
      </div>

      {/* ── TAB EDITAR ────────────────────────────────────────────── */}
      {tab === 'edit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Form */}
          <div className="space-y-3">
            <Field label={t('Asunto del email')} required>
              <input
                type="text"
                value={draft.subject}
                onChange={(e) => update('subject', e.target.value)}
                disabled={isLocked}
                placeholder={t('Novedades de mayo')}
                className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label={t('Preheader (preview text)')}>
              <input
                type="text"
                value={draft.preheader || ''}
                onChange={(e) => update('preheader', e.target.value || null)}
                disabled={isLocked}
                placeholder={t('Lo que se ve antes de abrir el email')}
                className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label={t('Imagen cabecera (URL)')}>
              <input
                type="url"
                value={draft.hero_image_url || ''}
                onChange={(e) => update('hero_image_url', e.target.value || null)}
                disabled={isLocked}
                placeholder="https://..."
                className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label={t('Cuerpo (markdown)')}>
              <textarea
                value={draft.body_markdown}
                onChange={(e) => update('body_markdown', e.target.value)}
                disabled={isLocked}
                rows={12}
                placeholder={t('## Próximas novedades\n\nEste mes tenemos camada nueva...')}
                className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink font-mono"
              />
              <p className="mt-1 text-[11px] text-muted">
                {t('Soporta **negrita**, *cursiva*, # H1, ## H2, listas, [links](url).')}
              </p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('CTA — texto botón')}>
                <input
                  type="text"
                  value={draft.cta_label || ''}
                  onChange={(e) => update('cta_label', e.target.value || null)}
                  disabled={isLocked}
                  placeholder={t('Ver más')}
                  className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
                />
              </Field>
              <Field label={t('CTA — URL')}>
                <input
                  type="url"
                  value={draft.cta_url || ''}
                  onChange={(e) => update('cta_url', e.target.value || null)}
                  disabled={isLocked}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
                />
              </Field>
            </div>
            <Field label={t('Reply-to (opcional)')}>
              <input
                type="email"
                value={draft.reply_to || ''}
                onChange={(e) => update('reply_to', e.target.value || null)}
                disabled={isLocked}
                placeholder={t('Default: tu email de criador')}
                className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
              />
            </Field>

            <button
              type="button"
              onClick={() => save(draft)}
              disabled={saving || isLocked}
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {t('Guardar ahora')}
            </button>
          </div>

          {/* Preview */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
              <Eye className="inline w-3 h-3 mr-1" />
              {t('Vista previa')}
            </p>
            <div className="rounded-xl border border-hairline bg-canvas overflow-hidden">
              {draft.hero_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <Img w={1000} src={draft.hero_image_url} alt="" className="w-full h-auto" />
              )}
              <div className="p-5">
                <p className="text-xs text-muted mb-2">
                  <strong className="text-ink">{kennelName}</strong> · {draft.subject || t('(sin asunto)')}
                </p>
                {draft.preheader && (
                  <p className="text-[11px] text-muted italic mb-3">{draft.preheader}</p>
                )}
                <p className="text-sm text-body mb-3">{t('Hola [nombre],')}</p>
                <div
                  className="contract-preview text-sm text-ink"
                  dangerouslySetInnerHTML={{ __html: renderContractMarkdown(draft.body_markdown || '') }}
                />
                {draft.cta_label && draft.cta_url && (
                  <div className="mt-5 text-center">
                    <span className="inline-block rounded-lg bg-ink text-on-primary px-5 py-2 text-sm font-semibold">
                      {draft.cta_label}
                    </span>
                  </div>
                )}
                <p className="mt-6 pt-4 border-t border-hairline text-[10px] text-muted text-center">
                  {t('Recibes este email porque te suscribiste al newsletter de')}
                  {' '}<strong>{kennelName}</strong>.
                  <br />
                  <span className="underline">{t('Darme de baja')}</span> · Genealogic
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB AUDIENCIA ──────────────────────────────────────────── */}
      {tab === 'audience' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
          {(Object.keys(AUDIENCE_LABELS) as AudienceType[])
            .filter((a) => a !== 'custom')
            .map((a) => {
              const count = audiences[a] || 0
              const active = draft.audience_type === a
              return (
                <button
                  key={a}
                  onClick={() => !isLocked && update('audience_type', a)}
                  disabled={isLocked}
                  className={`text-left rounded-xl border-2 p-4 transition ${
                    active
                      ? 'border-ink bg-surface-card ring-2 ring-ink/10'
                      : 'border-hairline bg-canvas hover:border-ink/30'
                  } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-bold text-ink">{t(AUDIENCE_LABELS[a])}</p>
                    <p className="text-2xl font-bold text-ink tabular-nums">{count}</p>
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{t(AUDIENCE_HINTS[a])}</p>
                </button>
              )
            })}
        </div>
      )}

      {/* ── TAB ENVIAR ─────────────────────────────────────────────── */}
      {tab === 'send' && (
        <div className="space-y-5 max-w-2xl">
          {/* Resumen pre-envío */}
          <div className="rounded-2xl border border-hairline bg-canvas p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Resumen')}</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row dt={t('Asunto')} dd={draft.subject || t('(sin asunto)')} />
              <Row dt={t('Audiencia')} dd={`${t(AUDIENCE_LABELS[draft.audience_type])} (${audienceCount} ${t('destinatarios')})`} />
              <Row dt="Reply-to" dd={draft.reply_to || t('tu email por defecto')} />
              <Row dt={t('Estado')} dd={<StatusBadge status={draft.status} t={t} />} />
            </dl>
          </div>

          {/* Si ya está enviada: stats */}
          {isLocked ? (
            <div className="rounded-2xl border border-hairline bg-canvas p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
                {t('Resultado del envío')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <BigStat label={t('Destinatarios')} value={draft.recipients_total} />
                <BigStat label={t('Entregados')} value={draft.delivered_count} accent="text-emerald-700" />
                <BigStat label={t('Abiertos')} value={draft.opened_count} sub={pct(draft.opened_count, draft.delivered_count)} />
                <BigStat label={t('Clicks')} value={draft.clicked_count} sub={pct(draft.clicked_count, draft.delivered_count)} />
                <BigStat label={t('Rebotes')} value={draft.bounced_count} accent={draft.bounced_count > 0 ? 'text-amber-700' : ''} />
                <BigStat label={t('Bajas')} value={draft.unsubscribed_count} accent={draft.unsubscribed_count > 0 ? 'text-amber-700' : ''} />
                <BigStat label={t('Fallos')} value={draft.failed_count} accent={draft.failed_count > 0 ? 'text-red-700' : ''} />
              </div>
              {draft.sent_at && (
                <p className="mt-4 text-[11px] text-muted">
                  {t('Enviada el')} {new Date(draft.sent_at).toLocaleString('es-ES')}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Test send */}
              <div className="rounded-2xl border border-hairline bg-canvas p-5">
                <p className="text-sm font-semibold text-ink inline-flex items-center gap-2">
                  <Beaker className="w-4 h-4" />
                  {t('Enviar prueba (1 email)')}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t('Te llega un email idéntico al real, con asunto')} <strong>[PRUEBA]</strong> {t('delante. Útil para revisar el render antes del envío masivo.')}
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="flex-1 rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
                  />
                  <button
                    onClick={sendTest}
                    disabled={testSending || !testEmail.trim() || !canSend}
                    title={!canSend ? t('Envío de newsletter próximamente disponible') : undefined}
                    className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {t('Enviar prueba')}
                  </button>
                </div>
                {testResult && (
                  <p className={`mt-2 text-xs ${testResult.startsWith('✓') ? 'text-emerald-700' : 'text-red-600'}`}>
                    {testResult}
                  </p>
                )}
              </div>

              {/* Send real */}
              <div className={`rounded-2xl border-2 ${canSend ? 'border-ink' : 'border-hairline'} bg-canvas p-5`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-ink inline-flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {t('Enviar a')} {audienceCount} {t('suscriptores')}
                  </p>
                  {!canSend && <ComingSoonChip featureId="newsletter_send" />}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {canSend ? (
                    <>
                      {t('Manda la campaña a toda la audiencia')} <strong>{t(AUDIENCE_LABELS[draft.audience_type])}</strong>.
                      {' '}{t('Tarda ~')}{Math.max(5, Math.ceil(audienceCount / 20))}{t(' segundos. No se puede deshacer.')}
                    </>
                  ) : (
                    <>
                      {t('El envío real de campañas está disponible para todos en las próximas semanas. Mientras tanto puedes diseñar la campaña y previsualizarla aquí.')}
                    </>
                  )}
                </p>
                {sendError && (
                  <p className="mt-2 text-xs text-red-600">
                    <AlertCircle className="inline w-3 h-3 mr-1" />
                    {sendError}
                  </p>
                )}
                {sendResult && (
                  <p className="mt-2 text-xs text-emerald-700">
                    <CheckCircle2 className="inline w-3 h-3 mr-1" />
                    {t('Envío completado:')} {sendResult.sent} OK, {sendResult.failed} {t('fallaron.')}
                  </p>
                )}
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={sending || audienceCount === 0 || !canSend}
                  title={!canSend ? t('Envío de newsletter próximamente disponible') : undefined}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('Enviando a')} {audienceCount} {t('suscriptores...')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('Enviar ahora')}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal confirmación envío */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-canvas rounded-2xl border border-hairline shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">{t('Confirmar envío')}</h3>
              <button onClick={() => setConfirmOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm text-body">
              <p>
                {t('Vas a enviar')} &ldquo;<strong>{draft.subject}</strong>&rdquo; {t('a')}{' '}
                <strong>{audienceCount} {t('suscriptores')}</strong>{' '}
                ({t(AUDIENCE_LABELS[draft.audience_type])}).
              </p>
              <p className="text-xs text-muted">
                {t('No se puede deshacer. Si necesitas cambiar algo, cancela y vuelve a la tab Editar.')}
              </p>
            </div>
            <div className="px-5 py-4 bg-surface-soft/40 border-t border-hairline flex gap-2 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:bg-surface-soft"
              >
                {t('Cancelar')}
              </button>
              <button
                onClick={launchSend}
                className="rounded-lg bg-ink text-on-primary px-5 py-2 text-sm font-semibold hover:opacity-90"
              >
                {t('Sí, enviar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function TabButton({
  active, onClick, icon: Icon, children, disabled,
}: {
  active: boolean; onClick: () => void; icon: typeof FileText
  children: React.ReactNode; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
        active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
        {label}{required && <span className="text-red-600 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

function Row({ dt, dd }: { dt: string; dd: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted text-xs uppercase tracking-wider">{dt}</dt>
      <dd className="text-ink font-medium text-right">{dd}</dd>
    </div>
  )
}

function StatusBadge({ status, t }: { status: CampaignRow['status']; t: (key: string) => string }) {
  const map = {
    draft:     { label: 'Borrador',   cls: 'bg-gray-100 text-gray-700' },
    scheduled: { label: 'Programada', cls: 'bg-amber-50 text-amber-800' },
    sending:   { label: 'Enviando…',  cls: 'bg-blue-50 text-blue-800' },
    sent:      { label: 'Enviada',    cls: 'bg-emerald-50 text-emerald-800' },
    failed:    { label: 'Fallo',      cls: 'bg-red-50 text-red-700' },
    cancelled: { label: 'Cancelada',  cls: 'bg-gray-100 text-gray-500' },
  }[status]
  return (
    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${map.cls}`}>
      {t(map.label)}
    </span>
  )
}

function BigStat({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-surface-soft/40 border border-hairline p-3">
      <p className={`text-2xl font-bold tabular-nums leading-none ${accent || 'text-ink'}`}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mt-1.5">{label}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function pct(part: number, whole: number): string {
  if (whole === 0) return '—'
  return `${Math.round((part * 100) / whole)}%`
}
