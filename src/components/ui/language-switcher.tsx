'use client'

/**
 * LanguageSwitcher — selector de idioma para visitantes.
 *
 * APAÑO i18n (2026-06): mientras el diccionario propio no esté 100% traducido,
 * la web se renderiza SIEMPRE en español (ver FORCE_SPANISH_ONLY en lib/locale.ts)
 * y este selector dispara Google Translate en el cliente: escribe la cookie
 * `googtrans=/es/<idioma>` y recarga; el widget (components/i18n/google-translate.tsx)
 * la lee y traduce la página. Elegir "Español" borra la cookie (vuelve a la base).
 *
 * Cuando completemos las traducciones propias, esto volverá a la cookie de locale.
 */
import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'

// Idiomas ofrecidos. Google Translate los cubre todos; 'es' es la base (sin traducir).
const LANGS: { code: string; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
]

/** Lee el idioma destino de la cookie googtrans (/es/en → 'en'); 'es' si no hay. */
function currentGoogTrans(): string {
  if (typeof document === 'undefined') return 'es'
  const m = document.cookie.match(/googtrans=\/[a-z]{2}\/([a-z]{2})/i)
  return m ? m[1].toLowerCase() : 'es'
}

/** Escribe (o borra) la cookie googtrans en todas las variantes de dominio. */
function setGoogTransCookie(target: string) {
  const host = window.location.hostname
  const variants = ['', `;domain=${host}`, `;domain=.${host}`]
  for (const d of variants) {
    if (target === 'es') {
      document.cookie = `googtrans=;path=/${d};expires=Thu, 01 Jan 1970 00:00:00 GMT`
    } else {
      document.cookie = `googtrans=/es/${target};path=/${d};max-age=${60 * 60 * 24 * 365}`
    }
  }
}

export default function LanguageSwitcher({
  variant = 'dark',
}: {
  /** 'dark' para footer oscuro, 'light' para fondos claros. */
  variant?: 'dark' | 'light'
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('es')
  const ref = useRef<HTMLDivElement>(null)

  // El render server es siempre 'es' (apaño); el idioma real lo marca la cookie GT.
  useEffect(() => {
    setActive(currentGoogTrans())
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const activeLang = LANGS.find((l) => l.code === active) || LANGS[0]

  function choose(code: string) {
    setOpen(false)
    if (code === active) return
    setGoogTransCookie(code)
    window.location.reload()
  }

  const isDark = variant === 'dark'
  const triggerCls = isDark ? 'text-on-dark-soft hover:text-white' : 'text-body hover:text-ink'

  return (
    // translate="no": que GT no traduzca el propio selector (los idiomas van en su lengua).
    <div className="relative" ref={ref} translate="no">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 text-[13px] font-medium transition ${triggerCls}`}
        aria-label="Cambiar idioma / Change language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{activeLang.flag} {activeLang.label}</span>
      </button>

      {open && (
        <div
          className={`absolute bottom-full mb-2 left-0 min-w-[160px] rounded-lg border shadow-lg overflow-hidden z-50 ${
            isDark ? 'bg-surface-dark border-white/15' : 'bg-canvas border-hairline'
          }`}
        >
          {LANGS.map((l) => {
            const isActive = l.code === active
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => choose(l.code)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-[13px] transition ${
                  isDark
                    ? 'text-on-dark-soft hover:bg-white/10 hover:text-white'
                    : 'text-body hover:bg-surface-soft hover:text-ink'
                }`}
              >
                <span>{l.flag} {l.label}</span>
                {isActive && <Check className="h-3.5 w-3.5" />}
              </button>
            )
          })}
          {active !== 'es' && (
            <p className="px-3 py-2 text-[10.5px] leading-tight text-muted border-t border-white/10">
              Traducción automática (Google)
            </p>
          )}
        </div>
      )}
    </div>
  )
}
