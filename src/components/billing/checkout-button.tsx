/**
 * Botón "Probar 14 días gratis" que dispara el Checkout de Stripe
 * para Kennel Pro (29€/mes). Kennel Enterprise NO usa este botón:
 * su alta es manual tras hablar con soporte.
 *
 * Usado en /pricing. Si el user NO está logueado, redirige a
 * /register?intent=breeder&plan=X que tras signup vuelve aquí.
 * Si SÍ está logueado, llama a POST /api/billing/checkout y redirige
 * a la URL de Stripe Checkout (que arranca el trial de 14 días sin
 * tarjeta inicial; el método de pago se solicita antes del primer
 * cargo).
 *
 * Nota: la prop `plan` sigue aceptando los nombres legacy 'pro'/'premium'
 * porque el endpoint los normaliza a kennel/kennel_pro internamente.
 * Esto evita romper otros sitios que lo siguen usando con el nombre viejo.
 *
 * Si Stripe no está configurado (falta env var), el endpoint devuelve 503
 * y mostramos un mensaje de "próximamente" en lugar de romper.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight } from 'lucide-react'

type Plan = 'pro' | 'premium'

export default function CheckoutButton({
  plan,
  cadence = 'monthly',
  label,
  className,
  style,
  isLoggedIn,
}: {
  plan: Plan
  cadence?: 'monthly' | 'annual'
  label: string
  className?: string
  /** Inline styles para color de marca del plan (vista pricing 4 planes) */
  style?: React.CSSProperties
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function start() {
    setError(null)
    if (!isLoggedIn) {
      // Va a /register con intent. Tras signup el dashboard te lleva al
      // flow correcto. El user puede volver a /pricing y reintentar.
      router.push(`/register?intent=breeder&plan=${plan}`)
      return
    }

    startTransition(async () => {
      try {
        // Usa el endpoint legacy /api/billing/checkout que mapea
        // {plan, interval} → price_id desde env vars STRIPE_PRICE_*.
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, interval: cadence }),
        })
        const json = await res.json()
        if (!res.ok) {
          if (res.status === 503) {
            setError('Pagos online próximamente. Escribe a hola@genealogic.io para activar tu plan manualmente.')
          } else {
            setError(json.message || 'Error iniciando el pago')
          }
          return
        }
        if (json.url) {
          window.location.href = json.url
        }
      } catch {
        setError('No se pudo iniciar el pago. Revisa tu conexión.')
      }
    })
  }

  return (
    <div>
      <button
        onClick={start}
        disabled={pending}
        style={style}
        className={className || 'inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition'}
      >
        {pending
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <>{label} <ArrowRight className="w-4 h-4" /></>}
      </button>
      {error && (
        <p className="mt-2 text-[11px] text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}
