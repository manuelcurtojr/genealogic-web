'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Wordmark } from '@/components/ui/wordmark'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 text-ink">
      <Link
        href="/login"
        className="absolute top-6 left-6 flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:text-ink hover:bg-surface-card"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="w-full max-w-[440px]">
        <Wordmark size="text-2xl" />
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Recuperar contraseña
        </p>
        <h1 className="mt-8 font-sans text-5xl font-normal leading-[1] tracking-[-0.025em] text-ink">
          Restablece
          <br />
          <span className="italic font-light">tu acceso.</span>
        </h1>

        {sent ? (
          <div className="mt-10 rounded-card border border-hairline bg-canvas p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-center">
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
            <p className="text-base font-medium text-ink">Email enviado</p>
            <p className="mt-2 text-sm text-body">
              Revisa <span className="text-ink">{email}</span> y sigue el enlace para crear una nueva contraseña.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
            >
              Volver al login
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-5 max-w-[380px] text-[15px] leading-[1.55] text-body">
              Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <div className="mt-10 rounded-card border border-hairline bg-canvas p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full rounded-lg border border-hairline bg-canvas py-3 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-3 text-sm font-medium text-on-primary transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Enviando…' : 'Enviar enlace'}
                </button>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-body">
              ¿Recordaste tu contraseña?{' '}
              <Link href="/login" className="text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">
                Inicia sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
