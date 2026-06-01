'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, AlertCircle, Eye, Edit3 } from 'lucide-react'
import { saveAboutMdAction } from '@/lib/kennel/content-actions'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  kennelId: string
  initialAboutMd: string | null
}

export default function AboutEditor({ kennelId, initialAboutMd }: Props) {
  const t = useT()
  const router = useRouter()
  const [value, setValue] = useState(initialAboutMd || '')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [pending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const charCount = value.trim().length
  const isPublishable = charCount >= 50
  const dirty = value !== (initialAboutMd || '')

  function save() {
    setError(null)
    startTransition(async () => {
      try {
        await saveAboutMdAction({ kennelId, aboutMd: value })
        setSavedAt(new Date())
        router.refresh()
      } catch (err) {
        // Mensaje al user + log a consola para inspección rápida en DevTools.
        // eslint-disable-next-line no-console
        console.error('[saveAboutMdAction] failed', err)
        const raw = err instanceof Error ? err.message : String(err)
        const human =
          raw === 'unauthorized' ? t('Tienes que iniciar sesión otra vez.') :
          raw === 'forbidden' ? t('No tienes permisos sobre este criadero.') :
          raw === 'requires_kennel_pro' ? t('Esta función está en Kennel Pro.') :
          `${t('No se pudo guardar:')} ${raw}`
        setError(human)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">
            {t('Sobre nosotros')}
          </h2>
          <p className="mt-1 text-[12.5px] text-muted leading-snug max-w-prose">
            {t('Cuenta tu historia, tu filosofía de cría y qué os distingue. Soporta saltos de línea y')}{' '}
            <code className="text-[11px]">**negrita**</code>.{' '}
            {t('Hace falta mínimo 50 caracteres para que la página sea pública.')}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-hairline bg-surface-soft p-0.5">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
              mode === 'edit' ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
            }`}
          >
            <Edit3 className="h-3 w-3" /> {t('Editar')}
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
              mode === 'preview' ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
            }`}
          >
            <Eye className="h-3 w-3" /> {t('Preview')}
          </button>
        </div>
      </div>

      {mode === 'edit' ? (
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={20}
          placeholder={t('Empieza por contar cuándo y por qué nació el criadero, qué razas crías y qué valores guían tu trabajo...')}
          className="w-full rounded-lg border border-hairline bg-canvas px-3 py-3 text-[14px] font-mono text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition resize-y leading-[1.5]"
        />
      ) : (
        <div className="rounded-lg border border-hairline bg-surface-soft p-5 min-h-[300px]">
          {value.trim() ? (
            <AboutPreview md={value} />
          ) : (
            <p className="text-[13px] text-muted italic">{t('Aún no hay contenido para previsualizar.')}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[11.5px] text-muted">
          <span className={charCount >= 50 ? 'text-emerald-700 font-medium' : ''}>
            {charCount.toLocaleString('es-ES')} {t('caracteres')}
          </span>
          {!isPublishable && (
            <span className="ml-2 text-amber-700">· {t('Necesitas ≥50 para publicar')}</span>
          )}
          {savedAt && !dirty && (
            <span className="ml-2 text-emerald-700 inline-flex items-center gap-1">
              <Check className="h-3 w-3" /> {t('Guardado')}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-on-primary hover:opacity-90 disabled:opacity-40 transition"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {pending ? t('Guardando...') : t('Guardar')}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}

/** Render conservador del markdown: bold (**x**), saltos de párrafo,
 *  no HTML arbitrario. Mismo que se usa en el perfil público. */
function AboutPreview({ md }: { md: string }) {
  // Split por dobles saltos para párrafos, luego inline render de **bold**
  const paragraphs = md.split(/\n\n+/)
  return (
    <div className="space-y-3 text-[14px] text-body leading-[1.65]">
      {paragraphs.map((p, i) => {
        // Inline render: convertir **x** en strong (regex simple)
        const parts: React.ReactNode[] = []
        const re = /\*\*([^*]+)\*\*/g
        let last = 0
        let m: RegExpExecArray | null
        let key = 0
        while ((m = re.exec(p)) !== null) {
          if (m.index > last) parts.push(p.slice(last, m.index))
          parts.push(<strong key={key++} className="text-ink font-semibold">{m[1]}</strong>)
          last = re.lastIndex
        }
        if (last < p.length) parts.push(p.slice(last))
        return (
          <p key={i} className="whitespace-pre-line">{parts.length ? parts : p}</p>
        )
      })}
    </div>
  )
}
