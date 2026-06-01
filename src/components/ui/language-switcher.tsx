'use client'

/**
 * LanguageSwitcher — selector de idioma para visitantes (anónimos o no).
 *
 * Escribe la cookie `genealogic-lang` (la misma que lee getLocale server-side)
 * y recarga para que TODOS los server components (header, footer, landings)
 * se re-rendericen en el nuevo idioma. También sincroniza localStorage para
 * los componentes client que usan getTranslator desde ahí.
 *
 * Para usuarios LOGUEADOS el ajuste definitivo vive en /settings
 * (profiles.language), que tiene prioridad sobre esta cookie. Este switcher
 * es sobre todo para el footer público / anónimos.
 */
import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'

const LOCALE_COOKIE = 'genealogic-lang'

// Idiomas ofrecidos en el switcher público. ES/EN son los activos hoy; el
// resto del diccionario existe pero la web pública aún no está 100% traducida
// a fr/de/pt/it, así que de momento ofrecemos solo los dos completos.
const LANGS: { code: string; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

export default function LanguageSwitcher({
  current,
  variant = 'dark',
}: {
  /** Locale actual resuelto en server (para marcar el activo). */
  current: string
  /** 'dark' para footer oscuro, 'light' para fondos claros. */
  variant?: 'dark' | 'light'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = LANGS.find((l) => l.code === current) || LANGS[0]

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function choose(code: string) {
    if (code === current) { setOpen(false); return }
    // Cookie de 1 año, accesible en server (no httpOnly) para que getLocale la lea.
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    try { localStorage.setItem(LOCALE_COOKIE, code) } catch { /* ignore */ }
    // Recarga para re-renderizar server components en el nuevo idioma.
    window.location.reload()
  }

  const isDark = variant === 'dark'
  const triggerCls = isDark
    ? 'text-on-dark-soft hover:text-white'
    : 'text-body hover:text-ink'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 text-[13px] font-medium transition ${triggerCls}`}
        aria-label="Cambiar idioma / Change language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{active.flag} {active.label}</span>
      </button>

      {open && (
        <div
          className={`absolute bottom-full mb-2 left-0 min-w-[150px] rounded-lg border shadow-lg overflow-hidden z-50 ${
            isDark ? 'bg-surface-dark border-white/15' : 'bg-canvas border-hairline'
          }`}
        >
          {LANGS.map((l) => {
            const isActive = l.code === current
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
        </div>
      )}
    </div>
  )
}
