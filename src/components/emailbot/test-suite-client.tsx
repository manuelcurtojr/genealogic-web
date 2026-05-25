/**
 * Launcher del test suite (client component).
 *
 * Gestiona:
 *  - "Sembrar 16 perfiles default" si profileCount===0
 *  - Botón "Lanzar test" con modal de confirmación + warning de coste
 *  - Estado pending mientras corre (~60-120s) con feedback claro
 *  - Redirect al detalle del run al terminar
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, Loader2, AlertTriangle, Check, X, BookOpen, FlaskConical,
} from 'lucide-react'

export default function TestSuiteClient({
  kennelId, kennelName, profileCount, knowledgeCount, botModelLabel, estimatedCostCents,
}: {
  kennelId: string
  kennelName: string
  profileCount: number
  knowledgeCount: number
  botModelLabel: string
  estimatedCostCents: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [seeding, setSeeding] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function seedDefaults() {
    setSeeding(true); setError(null)
    try {
      const res = await fetch('/api/emailbot/test-suite/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'seed_failed')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al sembrar perfiles')
    } finally {
      setSeeding(false)
    }
  }

  function launch() {
    setError(null); setConfirmOpen(false)
    startTransition(async () => {
      try {
        const res = await fetch('/api/emailbot/test-suite/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kennel_id: kennelId }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'launch_failed')
        // Redirect a detalle del run
        router.push(`/emailbot/test-suite/runs/${json.run_id}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al lanzar test')
      }
    })
  }

  // ── Estado: SIN PERFILES ────────────────────────────────────────────────
  if (profileCount === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-hairline bg-canvas p-8 text-center">
        <FlaskConical className="mx-auto h-10 w-10 text-muted mb-3" />
        <p className="text-base font-bold text-ink">Sin perfiles de cliente todavía</p>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          Te sembramos 16 perfiles default (6 happy path, 4 con objeción,
          4 casos límite, 2 de seguridad) para que empieces a probar tu bot.
          Después podrás editarlos o añadir los tuyos.
        </p>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        <button
          onClick={seedDefaults}
          disabled={seeding}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Sembrar 16 perfiles default
        </button>
      </div>
    )
  }

  // ── Estado: SIN BIBLIOTECA ──────────────────────────────────────────────
  if (knowledgeCount === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Tu biblioteca está vacía</p>
            <p className="mt-1 text-sm text-amber-800">
              El bot responderá demasiado genérico (sin precio, sin política, sin
              garantías) y la mayoría de los tests fallarán. Añade al menos 4-5
              entradas en la{' '}
              <Link href="/conocimiento" className="underline font-semibold">
                Biblioteca
              </Link>{' '}
              antes de lanzar el test.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Estado: LANZADOR ────────────────────────────────────────────────────
  return (
    <>
      <div className="rounded-2xl border border-hairline bg-canvas p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <StatBox label="Perfiles activos" value={profileCount.toString()} />
          <StatBox label="Entradas biblioteca" value={knowledgeCount.toString()} />
          <StatBox label="Modelo del bot" value={botModelLabel} small />
          <StatBox label="Coste estimado" value={`~${(estimatedCostCents / 100).toFixed(2)} €`} accent />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Link
            href="/emailbot/test-suite/profiles"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
          >
            <BookOpen className="w-4 h-4" />
            Ver / editar perfiles
          </Link>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-on-primary px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando {profileCount} conversaciones...
              </>
            ) : (
              <>
                <FlaskConical className="w-4 h-4" />
                Lanzar test ({profileCount} conv.)
              </>
            )}
          </button>
        </div>
        {pending && (
          <p className="mt-3 text-xs text-muted text-right">
            Tarda ~1-2 minutos. Te redirigimos al detalle cuando termine.
          </p>
        )}
        {error && <p className="mt-3 text-xs text-red-600 text-right">{error}</p>}
      </div>

      {/* Modal confirmación */}
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
              <h3 className="text-base font-bold text-ink inline-flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Confirma el lanzamiento
              </h3>
              <button onClick={() => setConfirmOpen(false)} className="text-muted hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm text-body">
              <p>
                Vas a lanzar un test con <strong>{profileCount} conversaciones</strong> contra
                tu bot ({botModelLabel}).
              </p>
              <ul className="space-y-1 text-[13px] pl-1">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-700 flex-shrink-0" />
                  Duración: <strong>~1-2 minutos</strong>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-700 flex-shrink-0" />
                  Coste estimado: <strong>~{(estimatedCostCents / 100).toFixed(2)} €</strong> (se
                  carga a tu cuenta como uso de IA)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-700 flex-shrink-0" />
                  No afecta a la cuota mensual de respuestas reales del bot
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-700 flex-shrink-0" />
                  Verás transcript completo + scoring de cada conversación
                </li>
              </ul>
              <p className="text-xs text-muted pt-1">
                Para bajar el coste, cambia a un modelo más barato en{' '}
                <Link
                  href="/emailbot"
                  onClick={() => setConfirmOpen(false)}
                  className="underline font-semibold text-ink"
                >
                  configuración del bot
                </Link>{' '}
                antes de lanzar (Haiku/GPT-4o mini/Gemini Flash bajan el coste 10x).
              </p>
            </div>
            <div className="px-5 py-4 bg-surface-soft/40 border-t border-hairline flex gap-2 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:bg-surface-soft"
              >
                Cancelar
              </button>
              <button
                onClick={launch}
                className="rounded-lg bg-ink text-on-primary px-5 py-2 text-sm font-semibold hover:opacity-90"
              >
                Sí, lanzar y cargar coste
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatBox({
  label, value, small, accent,
}: { label: string; value: string; small?: boolean; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-hairline bg-surface-soft/40 p-3 ${accent ? 'ring-2 ring-amber-300' : ''}`}>
      <p className={`font-bold text-ink leading-none tabular-nums ${small ? 'text-sm' : 'text-2xl'}`}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mt-1.5">{label}</p>
    </div>
  )
}
