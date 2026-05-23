'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, CheckCircle2 } from 'lucide-react'
import { AuthShell, Field, AuthSubmit, AuthError } from '@/components/auth/auth-shell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <AuthShell
        title="Email"
        titleTail="enviado."
        subtitle="Revisa tu bandeja de entrada y sigue el enlace para crear una nueva contraseña."
      >
        <div className="rounded-[12px] border border-[color:var(--success)]/30 bg-[color:var(--success)]/[0.06] p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--success)]" />
            <div>
              <p className="text-[14.5px] font-semibold text-ink">Te hemos enviado un email</p>
              <p className="mt-1 text-[13.5px] leading-[1.5] text-body">
                Revisa <span className="font-medium text-ink">{email}</span> y haz click en el enlace para
                crear una nueva contraseña. Si no lo ves en unos minutos, mira la carpeta de spam.
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted transition-colors hover:text-ink"
        >
          ← Volver al login
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Restablece"
      titleTail="tu acceso."
      subtitle="Introduce el email con el que te registraste. Te mandamos un enlace para crear una contraseña nueva."
      footer={{
        question: '¿Recordaste tu contraseña?',
        label: 'Iniciar sesión',
        href: '/login',
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="pt-2">
          <AuthSubmit loading={loading} loadingLabel="Enviando…">
            Enviar enlace
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  )
}
