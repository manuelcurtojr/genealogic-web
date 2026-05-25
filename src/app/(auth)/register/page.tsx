'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Store, Search } from 'lucide-react'
import { AuthShell, Field, AuthSubmit, AuthError, GoogleButton, OAuthDivider } from '@/components/auth/auth-shell'
import {
  parseIntentFromQuery,
  saveIntentClient,
  destinationForIntent,
  intentToOnboardingIntent,
  type SignupIntentData,
} from '@/lib/signup-intent'

function RegisterInner() {
  const searchParams = useSearchParams()
  const intentData: SignupIntentData | null = parseIntentFromQuery(searchParams)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const router = useRouter()

  // Persistir intent al cargar la página — sobrevive a OAuth redirect
  useEffect(() => {
    if (intentData) saveIntentClient(intentData)
  }, [intentData])

  // Destino post-signup (memoizable — depende de intent)
  const destination = destinationForIntent(intentData)

  const handleGoogle = async () => {
    if (!acceptTerms) {
      setError('Acepta los Términos y la Política de Privacidad para continuar.')
      return
    }
    setError('')
    setOauthLoading(true)
    const supabase = createClient()
    // Pasamos destination via ?next= para que /auth/callback lo respete
    const next = encodeURIComponent(destination)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Persistir onboarding_intent si vino marcado desde la landing/CTA.
    // Esto salta el Paso 0 (RoleSelector) del dashboard.
    const oi = intentToOnboardingIntent(intentData)
    if (oi && data.user?.id) {
      try {
        await supabase.from('profiles').update({ onboarding_intent: oi }).eq('id', data.user.id)
      } catch {
        /* no-op: el user puede elegir manualmente después */
      }
    }

    // Welcome email (best-effort, no bloquea redirect). El intent decide
    // qué variante manda (breeder vs owner).
    if (data.user?.id) {
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: oi || 'owner' }),
      }).catch(() => { /* swallow — email no debe bloquear UX */ })
    }

    router.push(destination)
  }

  // Branding contextual según intent — el header del shell cambia
  const shellProps = intentBranding(intentData)

  return (
    <AuthShell
      title={shellProps.title}
      titleTail={shellProps.titleTail}
      subtitle={shellProps.subtitle}
      footer={{
        question: '¿Ya tienes cuenta?',
        label: 'Iniciar sesión',
        href: intentData ? `/login?intent=${intentData.intent}&plan=${intentData.plan}` : '/login',
      }}
    >
      {intentData && <IntentBadge data={intentData} />}

      <GoogleButton
        onClick={handleGoogle}
        loading={oauthLoading}
        label="Continuar con Google"
      />
      <OAuthDivider label="o regístrate con email" />

      <form onSubmit={handleRegister} className="space-y-4">
        {error && <AuthError>{error}</AuthError>}

        <Field
          label="Nombre"
          icon={<User className="h-4 w-4" />}
          value={name}
          onChange={setName}
          placeholder="Tu nombre"
          required
          autoComplete="name"
        />

        <Field
          label="Email"
          icon={<Mail className="h-4 w-4" />}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />

        <Field
          label="Contraseña"
          icon={<Lock className="h-4 w-4" />}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
          autoComplete="new-password"
        />

        <label className="flex cursor-pointer items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-hairline accent-[color:var(--ink)]"
          />
          <span className="text-[12.5px] leading-[1.5] text-body">
            Acepto los{' '}
            <Link
              href="/terms"
              target="_blank"
              className="font-medium text-ink underline decoration-hairline underline-offset-[3px] transition-colors hover:decoration-ink"
            >
              Términos
            </Link>{' '}
            y la{' '}
            <Link
              href="/privacy"
              target="_blank"
              className="font-medium text-ink underline decoration-hairline underline-offset-[3px] transition-colors hover:decoration-ink"
            >
              Política de Privacidad
            </Link>
            .
          </span>
        </label>

        <div className="pt-2">
          <AuthSubmit loading={loading} loadingLabel="Creando cuenta…" disabled={!acceptTerms}>
            {shellProps.submitLabel}
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  )
}

export default function RegisterPage() {
  // Suspense porque useSearchParams() es async-aware
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  )
}

// ─── Helpers UI ─────────────────────────────────────────────────────────────

function intentBranding(data: SignupIntentData | null) {
  if (!data) {
    return {
      title: 'Crea tu',
      titleTail: 'cuenta.',
      subtitle: 'Sube tus perros, conecta su genealogía y deja que el mundo encuentre lo que crías. Gratis para empezar, sin tarjeta.',
      submitLabel: 'Crear cuenta gratis',
    }
  }
  if (data.intent === 'buyer') {
    return {
      title: 'Crea tu',
      titleTail: 'cuenta.',
      subtitle: 'Crea cuenta para gestionar tus reservas y ver tus perros recibidos. Sin coste.',
      submitLabel: 'Crear cuenta',
    }
  }
  // breeder
  const planLabel = data.plan === 'pro' ? 'Pro' : data.plan === 'premium' ? 'Premium' : 'Free'
  return {
    title: data.plan === 'free' ? 'Empieza' : 'Activa',
    titleTail: data.plan === 'free' ? 'gratis.' : `Genealogic ${planLabel}.`,
    subtitle: data.plan === 'free'
      ? 'Crea tu cuenta para registrar tu criadero y empezar a publicar tus perros.'
      : `Tu cuenta empieza en Free; ${planLabel} se activa cuando hayas creado tu afijo. Sin compromiso, cancelas cuando quieras.`,
    submitLabel: data.plan === 'free' ? 'Crear cuenta gratis' : `Crear cuenta y continuar`,
  }
}

function IntentBadge({ data }: { data: SignupIntentData }) {
  const Icon = data.intent === 'buyer' ? Search : Store
  const label = data.intent === 'buyer'
    ? 'Cuenta de comprador'
    : data.plan === 'free'
      ? 'Plan Free · sin tarjeta'
      : `Plan ${data.plan === 'pro' ? 'Pro' : 'Premium'} · activación tras crear criadero`
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-card px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-ink" />
      <span className="text-[12px] font-semibold text-ink">{label}</span>
    </div>
  )
}
