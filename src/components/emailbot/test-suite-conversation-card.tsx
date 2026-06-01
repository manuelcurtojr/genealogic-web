/**
 * Card de una conversación del test suite (colapsable).
 *
 * Cabecera siempre visible: nombre del perfil, score, badge passed/failed,
 * outcome esperado vs real. Click → expande con:
 *  - Análisis del evaluador
 *  - Bugs detectados
 *  - Transcript completo turn-by-turn
 */
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Bug } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

type TranscriptEntry = {
  role: 'client' | 'bot' | 'system'
  content: string
  tokens_in?: number
  tokens_out?: number
}

type Bug = { severity: string; type: string; description: string }

export type Conv = {
  id: string
  profile_name: string
  outcome: string | null
  expected_outcome: string | null
  passed: boolean | null
  score: number | null
  evaluator_analysis: string | null
  bugs_detected: Bug[] | null
  transcript: TranscriptEntry[]
  total_turns: number
  cost_cents: number
  tokens_input: number
  tokens_output: number
  error: string | null
  created_at: string
  completed_at: string | null
}

const OUTCOME_LABEL: Record<string, string> = {
  deposit_link_sent: 'Cierre con seña',
  escalated:         'Escala a humano',
  waitlist_added:    'Lista de espera',
  no_purchase:       'Sin compra',
  blocked:           'Bloqueado',
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high:     'bg-red-50 text-red-700',
  medium:   'bg-amber-50 text-amber-800',
  low:      'bg-blue-50 text-blue-800',
}

export default function ConversationCard({ conv }: { conv: Conv }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  const passed = conv.passed === true
  const failed = conv.passed === false && conv.error === null
  const errored = !!conv.error
  const outcomeMatch = conv.outcome === conv.expected_outcome

  return (
    <div className="rounded-xl border border-hairline bg-canvas overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-soft transition text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />}

        {/* Status icon */}
        {errored ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        ) : passed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        )}

        <p className="font-semibold text-sm text-ink flex-1 truncate">{conv.profile_name}</p>

        {/* Score */}
        {conv.score != null && (
          <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${
            conv.score >= 8 ? 'bg-emerald-50 text-emerald-800'
            : conv.score >= 5 ? 'bg-amber-50 text-amber-800'
            : 'bg-red-50 text-red-700'
          }`}>
            {conv.score}/10
          </span>
        )}

        {/* Outcome comparison */}
        <span className="text-[11px] text-muted hidden sm:inline">
          {t('esperado:')} <strong className="text-ink">{OUTCOME_LABEL[conv.expected_outcome || ''] ? t(OUTCOME_LABEL[conv.expected_outcome || '']) : '—'}</strong>
        </span>
        <span className={`text-[11px] hidden md:inline ${outcomeMatch ? 'text-emerald-700' : 'text-red-700'}`}>
          {t('real:')} <strong>{OUTCOME_LABEL[conv.outcome || ''] ? t(OUTCOME_LABEL[conv.outcome || '']) : (errored ? t('error') : '—')}</strong>
        </span>

        {(conv.bugs_detected?.length ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
            <Bug className="w-2.5 h-2.5" />
            {conv.bugs_detected!.length}
          </span>
        )}

        <span className="text-[11px] text-muted whitespace-nowrap hidden lg:inline">
          {conv.total_turns} {t('turnos')} · {(conv.cost_cents / 100).toFixed(3)} €
        </span>
      </button>

      {open && (
        <div className="border-t border-hairline px-4 py-4 space-y-4 bg-surface-soft/30">
          {errored ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              <strong>{t('Error en la conversación:')}</strong> {conv.error}
            </div>
          ) : (
            <>
              {/* Análisis evaluador */}
              {conv.evaluator_analysis && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                    {t('Análisis del evaluador')}
                  </p>
                  <p className="text-sm text-body leading-relaxed">{conv.evaluator_analysis}</p>
                </div>
              )}

              {/* Bugs */}
              {(conv.bugs_detected?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                    {t('Bugs detectados')} ({conv.bugs_detected!.length})
                  </p>
                  <ul className="space-y-1.5">
                    {conv.bugs_detected!.map((b, i) => (
                      <li key={i} className="rounded-lg border border-hairline bg-canvas p-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${SEVERITY_COLOR[b.severity] || 'bg-surface-card text-muted'}`}>
                            {b.severity}
                          </span>
                          <span className="text-xs font-semibold text-ink">{b.type}</span>
                        </div>
                        <p className="text-[12.5px] text-body">{b.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Transcript */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                  {t('Transcript')} ({conv.transcript.length} {t('mensajes')})
                </p>
                <ol className="space-y-2">
                  {conv.transcript.map((entry, i) => (
                    <li
                      key={i}
                      className={`rounded-lg p-3 text-[13px] ${
                        entry.role === 'client'
                          ? 'bg-blue-50 border border-blue-100'
                          : entry.role === 'bot'
                            ? 'bg-canvas border border-hairline'
                            : 'bg-surface-card border border-hairline text-muted'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                        {entry.role === 'client' ? `👤 ${t('Cliente simulado')}` : entry.role === 'bot' ? '🤖 Bot' : t('Sistema')}
                        {entry.tokens_in != null && (
                          <span className="ml-2 font-normal">
                            · in {entry.tokens_in} / out {entry.tokens_out}
                          </span>
                        )}
                      </p>
                      <p className="whitespace-pre-wrap text-ink leading-relaxed">{entry.content}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="pt-2 border-t border-hairline-soft flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                <span>
                  {t('Tokens:')} {conv.tokens_input.toLocaleString('es-ES')} in / {conv.tokens_output.toLocaleString('es-ES')} out
                </span>
                <span>{t('Coste:')} {(conv.cost_cents / 100).toFixed(4)} €</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
