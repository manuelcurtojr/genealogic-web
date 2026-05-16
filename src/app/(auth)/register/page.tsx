'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wordmark } from '@/components/ui/wordmark'
import { Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const router = useRouter()

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

    router.push('/dogs')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 text-ink">
      <Link
        href="/"
        className="absolute top-6 left-6 flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:text-ink hover:bg-surface-card"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="w-full max-w-[440px]">
        <Wordmark size="text-2xl" />
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Genealogías verificables
        </p>
        <h1 className="mt-8 font-display text-5xl font-normal leading-[1] tracking-[-0.025em] text-ink">
          Crea tu
          <br />
          <span className="italic font-light">cuenta.</span>
        </h1>
        <p className="mt-5 max-w-[380px] text-[15px] leading-[1.55] text-body">
          Sube tus perros, conecta su genealogía y deja que el mundo encuentre lo que crías.
        </p>

        <div className="mt-10 rounded-card border border-hairline bg-canvas p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full rounded-lg border border-hairline bg-canvas py-3 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none transition"
                />
              </div>
            </div>

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

            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-hairline bg-canvas py-3 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none transition"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-hairline bg-surface-card"
              />
              <span className="text-xs leading-relaxed text-body">
                Acepto los{' '}
                <a href="/terms" target="_blank" className="text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">
                  Términos
                </a>{' '}
                y la{' '}
                <a href="/privacy" target="_blank" className="text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">
                  Política de Privacidad
                </a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-3 text-sm font-medium text-on-primary transition hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-body">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-ink underline decoration-hairline underline-offset-4 transition hover:decoration-ink">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
