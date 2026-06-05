import Link from 'next/link'
import { Lock, Sparkles, ArrowRight } from 'lucide-react'

/**
 * EmbudoTeaser — lo que ve un criador FREE en /embudo.
 *
 * El embudo de ventas (ver, organizar y convertir las solicitudes en reservas)
 * es una característica Pro. Pero el FREE SÍ recibe las solicitudes por su web,
 * así que aquí le mostramos el NÚMERO REAL ("te han llegado N") sobre un tablero
 * de ejemplo BORROSO — el dolor del upsell es máximo: hay clientes esperando y
 * no puede trabajarlos.
 *
 * IMPORTANTE: el tablero de detrás es FALSO (placeholders). No se mandan al
 * navegador los datos reales del solicitante (nombre/email/teléfono de terceros).
 */
export default function EmbudoTeaser({ count }: { count: number }) {
  const hasLeads = count > 0
  // Columnas de ejemplo (falsas) para insinuar la estructura del embudo.
  const fakeStages = [
    { label: 'Nuevas', n: Math.max(1, Math.min(count || 1, 3)) },
    { label: 'Contactadas', n: 2 },
    { label: 'Reserva', n: 1 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{'Embudo de ventas'}</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {'Embudo'}
        </h1>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-canvas">
        {/* Tablero de ejemplo BORROSO (datos falsos, no PII real) */}
        <div className="pointer-events-none select-none blur-[6px] opacity-50 p-5" aria-hidden="true">
          <div className="grid grid-cols-3 gap-4">
            {fakeStages.map((s) => (
              <div key={s.label} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 rounded bg-ink/15" />
                  <div className="h-4 w-4 rounded-full bg-ink/10" />
                </div>
                {Array.from({ length: s.n }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-hairline bg-surface-soft p-3 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-ink/20" />
                    <div className="h-2.5 w-1/2 rounded bg-ink/10" />
                    <div className="h-2.5 w-2/3 rounded bg-ink/10" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Overlay del upsell */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-canvas/50 via-canvas/80 to-canvas/95 px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-canvas shadow-sm">
            <Lock className="h-5 w-5 text-ink" />
          </div>

          {hasLeads ? (
            <>
              <h2 className="mt-4 text-[22px] sm:text-[26px] font-semibold tracking-[-0.03em] text-ink">
                {`Tienes ${count} ${count === 1 ? 'solicitud' : 'solicitudes'} esperando`}
              </h2>
              <p className="mt-2 max-w-md text-[14px] leading-[1.55] text-body">
                {'Te han llegado solicitudes de información a través de tu web. Verlas, organizarlas y convertirlas en reservas es parte del '}
                <strong className="font-semibold text-ink">{'embudo de ventas Pro'}</strong>{'.'}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-[22px] sm:text-[26px] font-semibold tracking-[-0.03em] text-ink">
                {'Tu embudo de ventas'}
              </h2>
              <p className="mt-2 max-w-md text-[14px] leading-[1.55] text-body">
                {'Cuando te lleguen solicitudes por tu web, aquí podrás organizarlas, hacerles seguimiento y convertirlas en reservas. Es parte de '}
                <strong className="font-semibold text-ink">{'Pro'}</strong>{'.'}
              </p>
            </>
          )}

          <Link
            href="/pricing"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-primary transition-colors hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            {'Probar Pro 14 días gratis'}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2.5 text-[12px] text-muted">{'Sin tarjeta. Cancela cuando quieras.'}</p>
        </div>
      </div>
    </div>
  )
}
