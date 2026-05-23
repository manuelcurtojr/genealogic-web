'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, Sparkles, Check, Loader2, AlertCircle, Crown, Eye } from 'lucide-react'

type PublicView = 'standard' | 'custom_web'

interface Props {
  kennelId: string
  kennelSlug: string | null
  current: PublicView
  hasCustomWeb: boolean
  isPro: boolean
}

/**
 * Toggle público: el criador decide qué ven los visitantes que llegan
 * a /kennels/[slug]. Si elige "custom_web", la página estándar redirige
 * automáticamente a la web personalizada hecha con el builder.
 *
 * Estado:
 * - Si NO hay web publicada → opción custom_web deshabilitada + CTA "/web"
 * - Si NO es Pro → mostrar mensaje upgrade (web custom requiere Pro)
 * - Si todo OK → toggle funcional con optimistic update
 */
export default function PublicViewToggle({ kennelId, kennelSlug, current, hasCustomWeb, isPro }: Props) {
  const router = useRouter()
  const [value, setValue] = useState<PublicView>(current)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canEnableCustom = hasCustomWeb && isPro

  const handleChange = async (next: PublicView) => {
    if (next === value) return
    if (next === 'custom_web' && !canEnableCustom) return

    const prev = value
    setValue(next)
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('kennels')
      .update({ default_public_view: next })
      .eq('id', kennelId)

    setSaving(false)
    if (updateErr) {
      setValue(prev)
      setError(updateErr.message)
      return
    }
    router.refresh()
  }

  return (
    <section className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted" />
            Vista pública por defecto
          </h2>
          <p className="mt-1 text-[13px] text-body">
            Cuando alguien entra a tu URL pública, ¿qué quieres que vea?
          </p>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Opción 1: Perfil estándar Genealogic */}
        <button
          onClick={() => handleChange('standard')}
          className={`group rounded-xl border p-4 text-left transition-colors ${
            value === 'standard'
              ? 'border-ink bg-ink/5'
              : 'border-hairline bg-canvas hover:bg-surface-soft'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-card">
              <Store className="h-4 w-4 text-ink" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-ink">Perfil estándar</p>
                {value === 'standard' && (
                  <span className="inline-flex items-center gap-1 rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-on-primary">
                    <Check className="h-2.5 w-2.5" /> Activo
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12.5px] text-body">
                Vista automática de Genealogic con tus perros, camadas y palmarés. Funciona desde el día 1, sin configurar.
              </p>
              {kennelSlug && (
                <p className="mt-2 text-[11px] text-muted">
                  genealogic.io/kennels/{kennelSlug}
                </p>
              )}
            </div>
          </div>
        </button>

        {/* Opción 2: Web personalizada */}
        <button
          onClick={() => handleChange('custom_web')}
          disabled={!canEnableCustom}
          className={`group relative rounded-xl border p-4 text-left transition-colors ${
            value === 'custom_web'
              ? 'border-ink bg-ink/5'
              : canEnableCustom
                ? 'border-hairline bg-canvas hover:bg-surface-soft'
                : 'border-hairline bg-surface-soft opacity-75 cursor-not-allowed'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-100 to-purple-100">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[14px] font-semibold text-ink">Web personalizada</p>
                {value === 'custom_web' && (
                  <span className="inline-flex items-center gap-1 rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-on-primary">
                    <Check className="h-2.5 w-2.5" /> Activo
                  </span>
                )}
                {!isPro && (
                  <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-purple-700">
                    <Crown className="h-2.5 w-2.5" /> Pro
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12.5px] text-body">
                Tu URL pública lleva directo a tu web hecha con el builder. Tu marca, tu diseño, sin "powered by".
              </p>
              {kennelSlug && hasCustomWeb && (
                <p className="mt-2 text-[11px] text-muted">
                  → redirige a genealogic.io/c/{kennelSlug}
                </p>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Mensajes contextuales */}
      {!hasCustomWeb && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
          <p className="text-[12.5px] text-amber-900">
            Aún no has publicado tu web personalizada.{' '}
            <Link href="/web" className="font-medium underline hover:text-amber-700">
              Créala desde el editor →
            </Link>
          </p>
        </div>
      )}

      {hasCustomWeb && !isPro && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-3.5 py-2.5">
          <Crown className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-purple-600" />
          <p className="text-[12.5px] text-purple-900">
            Para hacer que tu URL pública lleve directo a tu web personalizada necesitas el plan Pro.{' '}
            <Link href="/cuenta/suscripcion" className="font-medium underline hover:text-purple-700">
              Ver planes →
            </Link>
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-[12px] text-[color:var(--error)]">{error}</p>
      )}
    </section>
  )
}
