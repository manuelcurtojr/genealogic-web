'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wordmark } from '@/components/ui/wordmark'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : error.message)
      setLoading(false)
      return
    }

    router.push('/dogs')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 px-6 text-fg">
      <Link
        href="/"
        className="absolute top-6 left-6 flex h-9 w-9 items-center justify-center rounded-full text-fg-mute transition hover:text-fg hover:bg-chip"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="w-full max-w-[440px]">
        <Wordmark size="text-2xl" />
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute">
          Genealogías verificables
        </p>
        <h1 className="mt-8 font-display text-5xl font-normal leading-[1] tracking-[-0.025em] text-fg">
          Bienvenido
          <br />
          <span className="italic font-light">de vuelta.</span>
        </h1>
        <p className="mt-5 max-w-[380px] text-[15px] leading-[1.55] text-fg-dim">
          Accede a tu cuenta para gestionar tus perros, criadero y camadas.
        </p>

        <div className="mt-10 rounded-card border border-hair-strong bg-ink-800 p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-fg-mute">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-mute" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full rounded-lg border border-hair-strong bg-chip py-3 pl-10 pr-4 text-sm text-fg placeholder:text-fg-mute focus:border-fg-dim focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-mute">
                  Contraseña
                </label>
                <Link href="/forgot-password" className="text-xs text-fg-dim hover:text-fg transition">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-mute" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
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
              {loading ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-fg-dim">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-fg underline decoration-fg-mute underline-offset-4 transition hover:decoration-fg">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  )
}
