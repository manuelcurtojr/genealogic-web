/**
 * Detalle de un test run.
 *
 * Si está en estado 'running', auto-refresca cada 5s para mostrar
 * conversaciones a medida que completan. Cuando termina, deja de refrescar.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import EmailbotSubnav from '@/components/emailbot/emailbot-subnav'
import RunAutoRefresh from '@/components/emailbot/test-suite-auto-refresh'
import ConversationCard from '@/components/emailbot/test-suite-conversation-card'
import { getModel } from '@/lib/ai/models'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Run · Test Suite · Genealogic Pro' }

type Run = {
  id: string
  kennel_id: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at: string | null
  total_conversations: number
  passed: number
  failed: number
  total_cost_cents: number
  total_tokens_input: number
  total_tokens_output: number
  bot_model: string | null
  notes: string | null
}

export default async function RunDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels').select('id, owner_id').eq('owner_id', user.id).maybeSingle()
  if (!kennel) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: runRow } = await admin
    .from('emailbot_test_runs')
    .select('*')
    .eq('id', id)
    .eq('kennel_id', kennel.id)
    .maybeSingle()
  const run = runRow as Run | null
  if (!run) notFound()

  const { data: convs } = await admin
    .from('emailbot_test_conversations')
    .select('id, profile_name, outcome, expected_outcome, passed, score, evaluator_analysis, bugs_detected, transcript, total_turns, cost_cents, tokens_input, tokens_output, error, created_at, completed_at')
    .eq('run_id', id)
    .order('created_at')
  const conversations = convs ?? []

  const total = run.total_conversations || conversations.length
  const passRate = total > 0 ? Math.round((run.passed / total) * 100) : 0
  const isRunning = run.status === 'running'

  return (
    <div className="space-y-5 max-w-5xl">
      <EmailbotSubnav />

      {isRunning && <RunAutoRefresh />}

      <div className="mt-4">
        <Link
          href="/emailbot/test-suite"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al historial
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Test run · {new Date(run.started_at).toLocaleString('es-ES')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink tracking-tight">
          {isRunning
            ? 'Ejecutando…'
            : run.status === 'failed'
              ? 'Test falló'
              : `${passRate}% pass rate (${run.passed}/${total})`}
        </h1>
      </div>

      {isRunning && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 flex items-center gap-3">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
          <p className="text-[13.5px] text-blue-900">
            El run sigue ejecutando. Las conversaciones aparecen abajo a medida
            que terminan. Esta página se refresca sola cada 5 segundos.
          </p>
        </div>
      )}

      {run.notes && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-900">
            <p className="font-semibold mb-1">Notas del run</p>
            <p>{run.notes}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Conversaciones" value={total.toString()} />
        <Stat label="Pasaron" value={run.passed.toString()} color="text-emerald-700" />
        <Stat label="Fallaron" value={run.failed.toString()} color="text-red-700" />
        <Stat
          label="Coste total"
          value={`${(run.total_cost_cents / 100).toFixed(3)} €`}
          sub={run.bot_model ? getModel(run.bot_model).label : ''}
        />
      </div>

      {/* Conversaciones */}
      <section className="mt-6">
        <h2 className="text-base font-bold text-ink mb-3">
          Conversaciones ({conversations.length})
        </h2>
        {conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline px-6 py-12 text-center text-muted">
            {isRunning ? 'Esperando primera conversación…' : 'Sin conversaciones'}
          </div>
        ) : (
          <div className="space-y-3">
            {(conversations as ConversationRow[]).map((c) => (
              <ConversationCard key={c.id} conv={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

type ConversationRow = {
  id: string
  profile_name: string
  outcome: string | null
  expected_outcome: string | null
  passed: boolean | null
  score: number | null
  evaluator_analysis: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bugs_detected: any[] | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transcript: any[]
  total_turns: number
  cost_cents: number
  tokens_input: number
  tokens_output: number
  error: string | null
  created_at: string
  completed_at: string | null
}

function Stat({
  label, value, color, sub,
}: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4">
      <p className={`text-2xl font-bold tabular-nums leading-none ${color || 'text-ink'}`}>
        {value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mt-2">
        {label}
      </p>
      {sub && <p className="text-[11px] text-muted mt-0.5 truncate">{sub}</p>}
    </div>
  )
}
