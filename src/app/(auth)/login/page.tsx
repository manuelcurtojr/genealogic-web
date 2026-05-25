'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import { AuthShell, Field, AuthSubmit, AuthError, GoogleButton, OAuthDivider } from '@/components/auth/auth-shell'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const router = useRouter()

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
          ? 'Email o contraseña incorrectos'
          : error.message,
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <AuthShell
      title="Bienvenido"
      titleTail="de vuelta."
      subtitle="Accede a tu cuenta de Genealogic — el registro público de genealogías caninas."
      footer={{
        question: '¿No tienes cuenta?',
        label: 'Crear cuenta',
        href: '/register',
      }}
    >
      <GoogleButton onClick={handleGoogle} loading={oauthLoading} />
      <OAuthDivider />

      <form onSubmit={handleLogin} className="space-y-4">
        {error && <AuthError>{error}</AuthError>}

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
          placeholder="Tu contraseña"
          required
          autoComplete="current-password"
          rightSlot={
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-muted transition-colors hover:text-ink"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          }
        />

        <div className="pt-2">
          <AuthSubmit loading={loading} loadingLabel="Entrando…">
            Iniciar sesión
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  )
}
