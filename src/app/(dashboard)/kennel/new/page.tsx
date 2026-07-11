/**
 * /kennel/new — formulario mínimo para crear el primer kennel.
 *
 * Si llega con `?plan=pro|premium` (típicamente desde el flujo signup
 * tras pricing → register), tras crear el kennel redirige a
 * `/cuenta/suscripcion?activate=pro` para activar el plan (gated por
 * early-access hasta que Stripe Checkout esté listo).
 *
 * Si llega sin plan o con `?plan=free`, redirige al dashboard normal.
 */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { readIntentClient, clearIntentClient } from '@/lib/signup-intent'
import FeedbackButton from '@/components/feedback/feedback-button'
import { useT } from '@/components/i18n/locale-provider'
import { generateSlug } from '@/lib/slug'
import { friendlyDbError } from '@/lib/supabase/friendly-error'

function NewKennelInner() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Plan: prioridad query param, luego cookie/session del signup intent
  const planFromQuery = searchParams.get('plan')
  const [resolvedPlan, setResolvedPlan] = useState<string>(planFromQuery || 'free')

  useEffect(() => {
    // Si no llegó por query, intentar leer del intent persistido
    if (!planFromQuery) {
      const intent = readIntentClient()
      if (intent && intent.intent === 'breeder' && intent.plan !== 'free') {
        setResolvedPlan(intent.plan)
      }
    }
  }, [planFromQuery])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')

  const isPaidPlan = resolvedPlan === 'pro' || resolvedPlan === 'premium'
  const planLabel = resolvedPlan === 'pro' ? 'Pro' : resolvedPlan === 'premium' ? 'Premium' : 'Free'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError(t('No autenticado'))
      setLoading(false)
      return
    }

    // Slug automático desde el nombre (QA 2026-07-11: los criaderos nacían
    // con slug null y su perfil público no tenía URL). Si choca con uno
    // existente, reintenta con sufijo aleatorio corto.
    const baseSlug = generateSlug(name.trim())
    let { error: err } = await supabase
      .from('kennels')
      .insert({ owner_id: user.id, name: name.trim(), slug: baseSlug })
    if (err && (err.message || '').toLowerCase().includes('duplicate')) {
      const retry = await supabase
        .from('kennels')
        .insert({ owner_id: user.id, name: name.trim(), slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}` })
      err = retry.error
    }
    if (err) {
      setError(friendlyDbError(err.message))
      setLoading(false)
      return
    }

    // Limpiar el intent guardado — ya cumplió su misión
    clearIntentClient()

    // Redirect según plan
    if (isPaidPlan) {
      router.push(`/cuenta/suscripcion?activate=${resolvedPlan}`)
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-muted hover:text-ink transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{t('Crear criadero')}</h1>
      </div>

      {/* Badge plan elegido */}
      {isPaidPlan && (
        <div className="mb-6 rounded-xl border-2 border-ink/10 bg-canvas p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-ink" />
            <p className="text-sm font-bold text-ink">{t('Plan')} {planLabel} {t('elegido')}</p>
          </div>
          <p className="text-xs text-muted">
            {t('Crea primero tu afijo. En el siguiente paso activarás')}{' '}
            <strong>Genealogic {planLabel}</strong>.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1.5 block">
            {t('Nombre del criadero *')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder={t('Ej: Irema Curtó')}
            className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full bg-ink text-on-primary hover:opacity-90 font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? t('Creando...') : isPaidPlan ? `${t('Continuar con')} ${planLabel}` : t('Crear criadero')}
        </button>

        <p className="text-xs text-muted text-center">
          {t('Podrás completar logo, raza y demás detalles después.')}
        </p>
      </form>
    </div>
  )
}

export default function NewKennelPage() {
  return (
    <Suspense fallback={null}>
      <NewKennelInner />
      <FeedbackButton scope="kennel_form" pageLabel="Crear criadero (/kennel/new)" />
    </Suspense>
  )
}
