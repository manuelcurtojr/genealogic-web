'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { AuthShell, Field, AuthSubmit, AuthError } from '@/components/auth/auth-shell'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [done, setDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthorized(!!session)
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  if (checking) {
    return (
      <AuthShell title="Verificando" titleTail="enlace…" subtitle="Un segundo, comprobando la sesión.">
        <div className="flex items-center justify-center gap-2 py-4 text-[14px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Verificando…
        </div>
      </AuthShell>
    )
  }

  if (!authorized) {
    return (
      <AuthShell
        title="Enlace"
        titleTail="no válido."
        subtitle="El enlace que has usado ha expirado o no es correcto. Solicita uno nuevo."
        footer={{
          question: '¿Quieres recordar tu contraseña actual?',
          label: 'Iniciar sesión',
          href: '/login',
        }}
      >
        <Link
          href="/forgot-password"
          className="inline-flex w-full items-center justify-center rounded-lg bg-ink px-5 py-3 text-[14px] font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          Solicitar nuevo enlace
        </Link>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell
        title="Contraseña"
        titleTail="actualizada."
        subtitle="Te llevamos al dashboard en un segundo."
      >
        <div className="rounded-[12px] border border-[color:var(--success)]/30 bg-[color:var(--success)]/[0.06] p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--success)]" />
            <div>
              <p className="text-[14.5px] font-semibold text-ink">Todo listo</p>
              <p className="mt-1 text-[13.5px] leading-[1.5] text-body">
                Tu contraseña se ha actualizado. Redirigiendo…
              </p>
            </div>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Cambia"
      titleTail="tu contraseña."
      subtitle="Elige una contraseña nueva. Mínimo 6 caracteres. Cuanto más larga, mejor."
      footer={{
        question: '¿Recordaste tu contraseña?',
        label: 'Iniciar sesión',
        href: '/login',
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthError>{error}</AuthError>}

        <Field
          label="Nueva contraseña"
          icon={<Lock className="h-4 w-4" />}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
          autoComplete="new-password"
        />

        <Field
          label="Confirmar contraseña"
          icon={<Lock className="h-4 w-4" />}
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repite tu contraseña"
          required
          minLength={6}
          autoComplete="new-password"
        />

        <div className="pt-2">
          <AuthSubmit loading={loading} loadingLabel="Guardando…">
            Cambiar contraseña
          </AuthSubmit>
        </div>
      </form>
    </AuthShell>
  )
}
