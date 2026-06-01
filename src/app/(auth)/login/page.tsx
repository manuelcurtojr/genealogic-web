'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import { AuthShell, Field, AuthSubmit, AuthError, GoogleButton, OAuthDivider } from '@/components/auth/auth-shell'
import { usePlatform } from '@/components/platform/platform-provider'
import { useT } from '@/components/i18n/locale-provider'

export default function LoginPage() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const router = useRouter()
  const { isIos } = usePlatform()
  // Google OAuth no funciona dentro de WKWebView (Google bloquea su
  // "disallowed_useragent"). Ocultamos el botón en iOS y dejamos solo
  // email/password. La opción nativa (Sign in with Apple o Google Sign-In
  // SDK) se implementará en una iteración posterior.

  const handleGoogle = async () => {
    setError('')
    setOauthLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(false)
    }
    // Si va bien, Supabase redirige al provider — no llegamos a la siguiente línea
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? t('Email o contraseña incorrectos')
          : error.message,
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <AuthShell
      title={t('Bienvenido')}
      titleTail={t('de vuelta.')}
      subtitle={t('Accede a tu cuenta de Genealogic — el registro público de genealogías caninas.')}
      footer={{
        question: t('¿No tienes cuenta?'),
        label: t('Crear cuenta'),
        href: '/register',
      }}
      hideChrome={isIos}
    >
      {!isIos && (
        <>
          <GoogleButton onClick={handleGoogle} loading={oauthLoading} />
          <OAuthDivider />
        </>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {error && <AuthError>{error}</AuthError>}

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
          placeholder={t('Tu contraseña')}
          required
          autoComplete="current-password"
          rightSlot={
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-muted transition-colors hover:text-ink"
            >
              {t('¿Olvidaste tu contraseña?')}
            </Link>
          }
        />

        <div className="pt-2">
          <AuthSubmit loading={loading} loadingLabel={t('Entrando…')}>
            {t('Iniciar sesión')}
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  )
}
