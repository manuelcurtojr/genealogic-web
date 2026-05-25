/**
 * Paso 0 del onboarding: el user elige si es CRIADOR o PROPIETARIO.
 *
 * Se muestra cuando profiles.onboarding_intent es NULL y el user no
 * tiene kennel ni reservas vinculadas (es decir, la app no puede
 * deducirlo sola).
 *
 * Cards "card-as-button" con icono grande + título + beneficios listados.
 * Comparable a Notion ("Personal use / Team / Education") al primer login.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Dog, Check, Loader2, ArrowRight } from 'lucide-react'
import { setOnboardingIntentAction } from '@/app/(dashboard)/dashboard/onboarding-intent-actions'

export default function RoleSelector({ displayName }: { displayName: string | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selecting, setSelecting] = useState<'breeder' | 'owner' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function choose(intent: 'breeder' | 'owner') {
    setError(null)
    setSelecting(intent)
    startTransition(async () => {
      try {
        await setOnboardingIntentAction(intent)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error guardando')
        setSelecting(null)
      }
    })
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
          Paso 1 de 2
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-ink tracking-tight">
          Hola{displayName ? `, ${displayName}` : ''}. ¿Qué te trae a Genealogic?
        </h1>
        <p className="mt-3 text-body text-base max-w-xl mx-auto">
          Personalizamos la experiencia según lo que necesites. Puedes cambiar después.
        </p>
      </div>

      {error && (
        <p className="text-center text-sm text-red-600 mb-4">{error}</p>
      )}

      {/* 2 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RoleCard
          intent="breeder"
          icon={Store}
          title="Soy criador"
          tagline="Tengo (o quiero tener) un criadero registrado."
          benefits={[
            'Crea tu afijo y publica tus perros',
            'Web pública con tu dominio',
            'Pipeline de reservas y clientes',
            'Emailbot que responde a leads',
          ]}
          onClick={() => choose('breeder')}
          loading={pending && selecting === 'breeder'}
          disabled={pending}
        />
        <RoleCard
          intent="owner"
          icon={Dog}
          title="Soy propietario"
          tagline="Tengo perros o he reservado uno en un criadero."
          benefits={[
            'Registra tus perros con su genealogía',
            'Ve tus reservas y papeles del cachorro',
            'Calendario de vacunas y vet',
            'Historial de salud completo',
          ]}
          onClick={() => choose('owner')}
          loading={pending && selecting === 'owner'}
          disabled={pending}
        />
      </div>

      {/* Footer */}
      <p className="text-center mt-8 text-[12px] text-muted">
        ¿Las dos cosas? Elige por la que vas a empezar. Puedes hacer las dos al mismo
        tiempo (un criador también gestiona los perros que cría como propietario).
      </p>
    </div>
  )
}

function RoleCard({
  intent: _intent, icon: Icon, title, tagline, benefits, onClick, loading, disabled,
}: {
  intent: 'breeder' | 'owner'
  icon: typeof Store
  title: string
  tagline: string
  benefits: string[]
  onClick: () => void
  loading: boolean
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-2xl border-2 bg-canvas p-6 transition group ${
        loading
          ? 'border-ink ring-2 ring-ink/10'
          : 'border-hairline hover:border-ink/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
      } disabled:cursor-wait`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-surface-card flex items-center justify-center flex-shrink-0 group-hover:bg-ink/10 transition">
          <Icon className="w-5 h-5 text-ink" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="text-xs text-muted mt-0.5 leading-relaxed">{tagline}</p>
        </div>
      </div>

      <ul className="space-y-1.5 mb-5">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-body">
            <Check className="w-3.5 h-3.5 mt-0.5 text-ink flex-shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <span
        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
          loading ? 'text-ink' : 'text-ink group-hover:translate-x-1 transition-transform'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            Continuar
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </span>
    </button>
  )
}
