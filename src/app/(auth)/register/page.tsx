'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User } from 'lucide-react'
import { AuthShell, Field, AuthSubmit, AuthError, GoogleButton, OAuthDivider } from '@/components/auth/auth-shell'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const router = useRouter()

  const handleGoogle = async () => {
    // Para registro con Google también exigimos que acepten términos primero
    if (!acceptTerms) {
      setError('Acepta los Términos y la Política de Privacidad para continuar.')
      return
    }
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
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <AuthShell
      title="Crea tu"
      titleTail="cuenta."
      subtitle="Sube tus perros, conecta su genealogía y deja que el mundo encuentre lo que crías. Gratis para empezar, sin tarjeta."
      footer={{
        question: '¿Ya tienes cuenta?',
        label: 'Iniciar sesión',
        href: '/login',
      }}
    >
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
            onChange={e => setAcceptTerms(e.target.checked)}
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
            Crear cuenta gratis
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  )
}
