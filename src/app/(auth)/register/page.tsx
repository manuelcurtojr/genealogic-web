'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Store, Search } from 'lucide-react'
import { AuthShell, Field, AuthSubmit, AuthError, GoogleButton, OAuthDivider } from '@/components/auth/auth-shell'
import { usePlatform } from '@/components/platform/platform-provider'
import { useT } from '@/components/i18n/locale-provider'
import {
  parseIntentFromQuery,
  saveIntentClient,
  destinationForIntent,
  intentToOnboardingIntent,
  type SignupIntentData,
} from '@/lib/signup-intent'

function RegisterInner() {
  const t = useT()
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
  const { isIos } = usePlatform()
  // Mismo motivo que en /login: Google OAuth no funciona en WKWebView.

  // Persistir intent al cargar la página — sobrevive a OAuth redirect
  useEffect(() => {
    if (intentData) saveIntentClient(intentData)
  }, [intentData])

  // Destino post-signup (memoizable — depende de intent)
  const destination = destinationForIntent(intentData)

  const handleGoogle = async () => {
    if (!acceptTerms) {
      setError(t('Acepta los Términos y la Política de Privacidad para continuar.'))
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

      // Persistir signup_meta (UTM/referrer/landing) en profiles + alerta
      // al super admin. Lee la cookie que el middleware setea al primer hit.
      // Best-effort, no bloquea el redirect.
      fetch('/api/track-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => { /* swallow */ })
    }

    router.push(destination)
  }

  // Branding contextual según intent — el header del shell cambia
  const shellProps = intentBranding(intentData, t)

  return (
    <AuthShell
      title={shellProps.title}
      titleTail={shellProps.titleTail}
      subtitle={shellProps.subtitle}
      footer={{
        question: t('¿Ya tienes cuenta?'),
        label: t('Iniciar sesión'),
        href: intentData ? `/login?intent=${intentData.intent}&plan=${intentData.plan}` : '/login',
      }}
      hideChrome={isIos}
    >
      {intentData && !isIos && <IntentBadge data={intentData} />}

      {!isIos && (
        <>
          <GoogleButton
            onClick={handleGoogle}
            loading={oauthLoading}
            label={t('Continuar con Google')}
          />
          <OAuthDivider label={t('o regístrate con email')} />
        </>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        {error && <AuthError>{error}</AuthError>}

        <Field
          label={t('Nombre')}
          icon={<User className="h-4 w-4" />}
          value={name}
          onChange={setName}
          placeholder={t('Tu nombre')}
          required
          autoComplete="name"
        />

        <Field
          label={t('Email')}
          icon={<Mail className="h-4 w-4" />}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />

        <Field
          label={t('Contraseña')}
          icon={<Lock className="h-4 w-4" />}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={t('Mínimo 6 caracteres')}
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
            {t('Acepto los')}{' '}
            <Link
              href="/terms"
              target="_blank"
              className="font-medium text-ink underline decoration-hairline underline-offset-[3px] transition-colors hover:decoration-ink"
            >
              {t('Términos')}
            </Link>{' '}
            {t('y la')}{' '}
            <Link
              href="/privacy"
              target="_blank"
              className="font-medium text-ink underline decoration-hairline underline-offset-[3px] transition-colors hover:decoration-ink"
            >
              {t('Política de Privacidad')}
            </Link>
            .
          </span>
        </label>

        <div className="pt-2">
          <AuthSubmit loading={loading} loadingLabel={t('Creando cuenta…')} disabled={!acceptTerms}>
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

function intentBranding(data: SignupIntentData | null, t: (key: string) => string) {
  if (!data) {
    return {
      title: t('Crea tu'),
      titleTail: t('cuenta.'),
      subtitle: t('El registro público de genealogías caninas. Para criadores que documentan su trabajo y propietarios que quieren tenerlo todo a mano. Gratis para empezar, sin tarjeta.'),
      submitLabel: t('Crear cuenta gratis'),
    }
  }
  if (data.intent === 'buyer') {
    return {
      title: t('Crea tu'),
      titleTail: t('cuenta.'),
      subtitle: t('Crea cuenta para gestionar tus reservas y ver tus perros recibidos. Sin coste.'),
      submitLabel: t('Crear cuenta'),
    }
  }
  // breeder
  // Plan comercial nuevo, mapeado desde los valores que aún acepta el type
  // SignupPlan ('free' | 'kennel' | 'kennel_pro' | 'pro' | 'premium').
  // Tras el rename:
  //   kennel_pro / premium → Kennel Enterprise (149€/mes · activación manual)
  //   pro / kennel        → Kennel Pro (49€/mes · 14 días gratis sin tarjeta)
  //   free                → Kennel Free (5 perros · gratis)
  // El plan Owner (3 perros) llega por intent === 'owner', no por data.plan.
  const planStr = data.plan as string
  const isEnterprise = planStr === 'enterprise' || planStr === 'kennel_pro' || planStr === 'premium'
  const isPro = planStr === 'pro' || planStr === 'kennel'
  const isOwner = planStr === 'owner'
  const isFree = planStr === 'free' && !isOwner
  const planLabel = isEnterprise
    ? 'Kennel Enterprise'
    : isPro
      ? 'Kennel Pro'
      : isOwner
        ? 'Owner'
        : 'Kennel Free'
  return {
    title: isFree || isOwner ? t('Empieza') : t('Activa'),
    titleTail: isFree || isOwner ? t('gratis.') : `Genealogic ${planLabel}.`,
    subtitle: isOwner
      ? t('Tu plan Owner es gratis para siempre, hasta 3 perros. Crea tu cuenta y empieza a documentar tu mascota.')
      : isFree
        ? t('Tu plan Kennel Free es gratis para siempre, hasta 5 perros. Crea tu cuenta para registrar tu criadero y empezar a publicar tus perros.')
        : isEnterprise
          ? t('Kennel Enterprise se activa de forma manual tras hablar con soporte (hola@genealogic.io). Crea tu cuenta y nos coordinamos contigo para el alta.')
          : t('Kennel Pro empieza con 14 días gratis sin tarjeta. Antes de terminar la prueba te pedimos método de pago para continuar.'),
    submitLabel: isFree || isOwner ? t('Crear cuenta gratis') : t('Crear cuenta y continuar'),
  }
}

function IntentBadge({ data }: { data: SignupIntentData }) {
  const t = useT()
  const Icon = data.intent === 'buyer' ? Search : Store
  const planStr = data.plan as string
  const isEnterprise = planStr === 'enterprise' || planStr === 'kennel_pro' || planStr === 'premium'
  const isPro = planStr === 'pro' || planStr === 'kennel'
  const isOwner = planStr === 'owner'
  const label = data.intent === 'buyer'
    ? t('Cuenta de comprador')
    : isOwner
      ? t('Plan Owner · Gratis para siempre · 3 perros')
      : planStr === 'free'
        ? t('Plan Kennel Free · Gratis para siempre · 5 perros')
        : isEnterprise
          ? t('Plan Kennel Enterprise · Activación manual tras hablar con soporte')
          : isPro
            ? t('Plan Kennel Pro · 14 días gratis sin tarjeta')
            : t('Plan Kennel Free · Gratis para siempre · 5 perros')
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-card px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-ink" />
      <span className="text-[12px] font-semibold text-ink">{label}</span>
    </div>
  )
}
