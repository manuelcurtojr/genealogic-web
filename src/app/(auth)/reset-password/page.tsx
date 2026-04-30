'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wordmark } from '@/components/ui/wordmark'
import { Lock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

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
    setTimeout(() => router.push('/dogs'), 1800)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 px-6 text-fg">
      <Link
        href="/login"
        className="absolute top-6 left-6 flex h-9 w-9 items-center justify-center rounded-full text-fg-mute transition hover:text-fg hover:bg-chip"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="w-full max-w-[440px]">
        <Wordmark size="text-2xl" />
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute">
          Nueva contraseña
        </p>
        <h1 className="mt-8 font-display text-5xl font-normal leading-[1] tracking-[-0.025em] text-fg">
          Cambia
          <br />
          <span className="italic font-light">tu contraseña.</span>
        </h1>

        <div className="mt-10 rounded-card border border-hair-strong bg-ink-800 p-6 sm:p-8">
          {checking ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-fg-mute">
              <Loader2 className="h-4 w-4 animate-spin" /> Verificando enlace…
            </div>
          ) : !authorized ? (
            <div className="text-center">
              <p className="text-base font-medium text-fg">Enlace no válido o expirado</p>
              <p className="mt-2 text-sm text-fg-dim">Solicita un nuevo enlace de recuperación.</p>
              <Link
                href="/forgot-password"
                className="mt-5 inline-block text-sm text-fg underline decoration-fg-mute underline-offset-4 hover:decoration-fg"
              >
                Recuperar contraseña
              </Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
              <p className="text-base font-medium text-fg">Contraseña actualizada</p>
              <p className="mt-2 text-sm text-fg-dim">Redirigiendo…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-fg-mute">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-mute" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-hair-strong bg-chip py-3 pl-10 pr-4 text-sm text-fg placeholder:text-fg-mute focus:border-fg-dim focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-fg-mute">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-mute" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-hair-strong bg-chip py-3 pl-10 pr-4 text-sm text-fg placeholder:text-fg-mute focus:border-fg-dim focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-paper-50 py-3 text-sm font-medium text-ink-900 transition hover:opacity-90 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
