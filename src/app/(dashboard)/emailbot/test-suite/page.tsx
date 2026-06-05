/**
 * Test suite del Emailbot — página principal.
 *
 * Muestra:
 *  - Aviso prominente sobre coste real (esta página dispara llamadas a IA
 *    que se cargan al kennel)
 *  - Stats del runner: cuántos perfiles activos, modelo elegido, coste estimado
 *  - Botón "Lanzar test" con modal de confirmación
 *  - Historial de runs anteriores (passrate, coste, duración, link a detalle)
 *
 * Si no hay perfiles todavía, ofrece sembrar los 16 default con un click.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FlaskConical, AlertTriangle, ChevronRight } from 'lucide-react'
import EmailbotSubnav from '@/components/emailbot/emailbot-subnav'
import TestSuiteClient from '@/components/emailbot/test-suite-client'
import { getModel, getDefaultModel } from '@/lib/ai/models'
import { estimateRunCostCents } from '@/lib/ai/emailbot-tester'
import { kennelHasAddon } from '@/lib/kennel/addons'
import ComingSoon from '@/components/early-access/coming-soon'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Test Suite · Emailbot · Genealogic Pro' }

export default async function TestSuitePage() {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, name, bot_model, addons, owner_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!kennel) {
    return (
      <div className="space-y-5">
        <EmailbotSubnav />
        <div className="max-w-2xl mx-auto py-10">
          <h1 className="text-3xl font-bold text-ink mb-3">Test Suite</h1>
          <p className="text-body">{t('Necesitas un criadero registrado.')}</p>
        </div>
      </div>
    )
  }

  // Gate por extensión: el test suite cuesta dinero real (~1-2€/run); de
  // momento solo para quien tiene la extensión Emailbot hasta tener quota/billing.
  if (!kennelHasAddon(kennel, 'emailbot', user.id)) {
    return (
      <div className="space-y-5">
        <EmailbotSubnav />
        <ComingSoon
          featureId="bot_test_suite"
          description={t('Bate 16 perfiles ficticios contra tu bot y obtén scoring + bugs detectados. Llegará para todos cuando tengamos sistema de cuotas y pago por uso.')}
          backHref="/emailbot"
          backLabel={t('← Volver al Emailbot')}
        />
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const [{ count: profileCount }, { data: runs }, { count: knowledgeCount }] = await Promise.all([
    admin.from('emailbot_test_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id)
      .eq('is_active', true),
    admin.from('emailbot_test_runs')
      .select('id, status, started_at, completed_at, total_conversations, passed, failed, total_cost_cents, bot_model')
      .eq('kennel_id', kennel.id)
      .order('started_at', { ascending: false })
      .limit(20),
    admin.from('knowledge_entries')
      .select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id)
      .eq('is_active', true),
  ])

  const botModelId: string = (kennel as { bot_model?: string }).bot_model || getDefaultModel().id
  const model = getModel(botModelId)
  const profiles = profileCount || 0
  const knowledge = knowledgeCount || 0
  const estimatedCostCents = profiles > 0 ? estimateRunCostCents({ numProfiles: profiles, botModelId }) : 0

  return (
    <div className="space-y-5 max-w-5xl">
      <EmailbotSubnav />

      <header className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Emailbot · {t('Suite de tests')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink tracking-tight inline-flex items-center gap-3">
          <FlaskConical className="h-7 w-7" />
          {t('Probar el bot con')} {profiles} {t('perfiles ficticios')}
        </h1>
        <p className="mt-2 text-body max-w-3xl">
          {t('Lanza una batería de conversaciones simuladas con perfiles de cliente diversos (familias, criadores, abogados, intentos de fraude). Un evaluador puntúa cada hilo y detecta bugs como alucinaciones, descuentos no autorizados o filtraciones de datos.')}
        </p>
      </header>

      {/* Aviso de coste — pieza más importante de la página */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 flex-1">
            <p className="font-bold mb-1">{t('Herramienta potente con coste real')}</p>
            <p className="leading-relaxed">
              {t('Cada test lanza ~')}{profiles || 16} {t('conversaciones contra IAs reales (modelo del bot + simulador del cliente + evaluador). El gasto se carga a tu cuenta de Genealogic y aparece en')}{' '}
              <Link href="/cuenta/facturacion" className="underline font-semibold">
                /cuenta/facturación
              </Link>
              {' '}{t('como uso de IA fuera de la cuota de respuestas del bot.')}
            </p>
            <p className="mt-2 leading-relaxed">
              <strong>{t('Coste estimado por test completo:')}</strong>{' '}
              ~<strong>{(estimatedCostCents / 100).toFixed(2)} €</strong>{' '}
              {t('con tu modelo actual (')}<strong>{model.label}</strong>{t('). Cambia a un modelo más barato en')}{' '}
              <Link href="/emailbot" className="underline font-semibold">
                {t('la configuración del bot')}
              </Link>{' '}
              {t('si quieres bajar el coste.')}
            </p>
          </div>
        </div>
      </div>

      {/* Pre-requisitos / launcher */}
      <TestSuiteClient
        kennelId={kennel.id}
        kennelName={kennel.name}
        profileCount={profiles}
        knowledgeCount={knowledge}
        botModelLabel={model.label}
        estimatedCostCents={estimatedCostCents}
      />

      {/* Historial de runs */}
      <section className="mt-8">
        <h2 className="text-base font-bold text-ink mb-3">{t('Historial de tests')}</h2>
        {(!runs || runs.length === 0) ? (
          <div className="rounded-xl border border-dashed border-hairline px-6 py-12 text-center text-muted">
            {t('Aún no has lanzado ningún test. Pulsa el botón de arriba para empezar.')}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
            <table className="w-full text-sm">
              <thead className="bg-surface-soft/50 border-b border-hairline">
                <tr>
                  <Th>{t('Fecha')}</Th>
                  <Th>{t('Estado')}</Th>
                  <Th align="right">{t('Conv.')}</Th>
                  <Th align="right">{t('Pass rate')}</Th>
                  <Th align="right">{t('Duración')}</Th>
                  <Th align="right">{t('Coste')}</Th>
                  <Th align="right">{t('Modelo')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {(runs as RunRow[]).map((r) => {
                  const total = r.total_conversations || 0
                  const passRate = total > 0 ? Math.round((r.passed / total) * 100) : 0
                  return (
                    <tr key={r.id} className="border-t border-hairline-soft hover:bg-surface-soft transition">
                      <td className="px-4 py-2.5 text-body text-[12.5px]">{fmtDate(r.started_at)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={r.status} t={t} /></td>
                      <td className="px-4 py-2.5 text-right text-body tabular-nums">{total}</td>
                      <td className="px-4 py-2.5 text-right">
                        <PassRateBadge total={total} passed={r.passed} pct={passRate} />
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted text-[12.5px]">
                        {fmtDuration(r.started_at, r.completed_at)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-body tabular-nums">
                        {(r.total_cost_cents / 100).toFixed(2)} €
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted text-[11px]">
                        {r.bot_model ? getModel(r.bot_model).label : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/emailbot/test-suite/runs/${r.id}`}
                          className="inline-flex items-center text-ink hover:underline text-[12.5px] font-semibold"
                        >
                          {t('Ver')} <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Utilities ──────────────────────────────────────────────────────────────
type RunRow = {
  id: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at: string | null
  total_conversations: number
  passed: number
  failed: number
  total_cost_cents: number
  bot_model: string | null
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}

function StatusBadge({ status, t }: { status: 'running' | 'completed' | 'failed'; t: (k: string) => string }) {
  const map = {
    running:   { label: `⏳ ${t('Ejecutando')}`, cls: 'bg-blue-50 text-blue-800' },
    completed: { label: `✓ ${t('Completado')}`,  cls: 'bg-emerald-50 text-emerald-800' },
    failed:    { label: `✕ ${t('Falló')}`,       cls: 'bg-red-50 text-red-700' },
  }[status]
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${map.cls}`}>
      {map.label}
    </span>
  )
}

function PassRateBadge({ total, passed, pct }: { total: number; passed: number; pct: number }) {
  if (total === 0) return <span className="text-muted">—</span>
  const cls = pct >= 80
    ? 'bg-emerald-50 text-emerald-800'
    : pct >= 50
      ? 'bg-amber-50 text-amber-800'
      : 'bg-red-50 text-red-700'
  return (
    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${cls}`}>
      {pct}% ({passed}/{total})
    </span>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function fmtDuration(start: string, end: string | null): string {
  if (!end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  return `${Math.round(sec / 60)} min`
}
